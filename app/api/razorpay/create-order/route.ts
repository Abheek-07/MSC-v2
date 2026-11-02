import { NextResponse } from 'next/server';
import { enforcePayloadSize, isPayloadTooLargeError, isValidUUID } from '@/lib/security';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { getRazorpayClient } from '@/lib/razorpay';
import { getAdminClient } from '@/lib/supabase/admin';
import { getRegistrationClaim, hashRegistrationClaim } from '@/lib/registration-claim';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await enforcePayloadSize(req, 16 * 1024);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const clientIp = getClientIP(req.headers);
    const rateLimit = await checkRateLimit(`rzp_order_${clientIp}`, 'payment');
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many payment requests. Please wait a minute.' }, { status: 429 });
    }

    const eventId = body.event_id;
    const registrationId = body.registration_id;
    if (!isValidUUID(eventId as string) || !isValidUUID(registrationId as string)) {
      return NextResponse.json({ error: 'Invalid event or registration ID.' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: registration, error: registrationError } = await supabase
      .from('registrations')
      .select('id, event_id, user_id, status, form_data, registration_claim_hash')
      .eq('id', registrationId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (registrationError) throw registrationError;
    if (!registration) return NextResponse.json({ error: 'Registration not found for this event.' }, { status: 404 });
    const claim = getRegistrationClaim(req);
    if (!claim || !registration.registration_claim_hash || registration.registration_claim_hash !== hashRegistrationClaim(claim)) {
      // Registration ids are references, not checkout credentials. Guests must
      // initiate payment from the browser that owns the registration claim.
      return NextResponse.json({ error: 'This checkout session is not authorized for the selected registration.' }, { status: 403 });
    }
    if (registration.status !== 'pending_payment') {
      return NextResponse.json({ error: 'This registration is not awaiting payment.' }, { status: 409 });
    }
    if (
      registration.form_data?.no_refund_policy_accepted !== true ||
      registration.form_data?.no_refund_policy_version !== '2026-11-01' ||
      !registration.form_data?.no_refund_policy_accepted_at
    ) {
      return NextResponse.json(
        { error: 'No-refund policy acceptance is required before payment.' },
        { status: 403 }
      );
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, form_requirements')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

    const fee = Number(event.form_requirements?.registration_fee);
    if (!Number.isSafeInteger(fee) || fee <= 0 || !Number.isSafeInteger(fee * 100)) {
      return NextResponse.json({ error: 'A valid registration fee is not configured for this event.' }, { status: 409 });
    }
    const amountInPaise = fee * 100;

    // Reuse an existing unexpired order. This makes repeated checkout requests idempotent.
    const { data: previousOrder, error: previousOrderError } = await supabase
      .from('payment_orders')
      .select('id, razorpay_order_id, amount, currency, status, expires_at')
      .eq('registration_id', registration.id)
      .in('status', ['creating', 'created'])
      .maybeSingle();

    if (previousOrderError) throw previousOrderError;
    if (previousOrder && new Date(previousOrder.expires_at).getTime() > Date.now()) {
      if (previousOrder.status === 'created' && previousOrder.razorpay_order_id) {
        return NextResponse.json({
          success: true,
          order_id: previousOrder.razorpay_order_id,
          amount: previousOrder.amount,
          currency: previousOrder.currency,
          reused: true,
        });
      }
      return NextResponse.json({ error: 'Payment order creation is already in progress. Retry shortly.' }, { status: 409 });
    }

    if (previousOrder) {
      const { error } = await supabase.from('payment_orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', previousOrder.id);
      if (error) throw error;
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const { data: orderRecord, error: insertError } = await supabase
      .from('payment_orders')
      .insert({
        event_id: registration.event_id,
        registration_id: registration.id,
        user_id: registration.user_id,
        idempotency_key: registration.id,
        amount: amountInPaise,
        currency: 'INR',
        status: 'creating',
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (insertError) {
      // A concurrent request may have won the active-order unique constraint.
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'A payment order is already being created. Retry shortly.' }, { status: 409 });
      }
      throw insertError;
    }

    try {
      const gatewayOrder = await getRazorpayClient().orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `msc_${registration.id.replace(/-/g, '').slice(0, 20)}`,
        notes: { event_id: registration.event_id, registration_id: registration.id },
      });

      const { error: updateError } = await supabase
        .from('payment_orders')
        .update({
          razorpay_order_id: gatewayOrder.id,
          status: 'created',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderRecord.id)
        .eq('status', 'creating');

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        order_id: gatewayOrder.id,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
      });
    } catch (gatewayError) {
      await supabase.from('payment_orders')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', orderRecord.id);
      throw gatewayError;
    }
  } catch (err) {
    if (isPayloadTooLargeError(err)) {
      return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    }
    console.error('[Razorpay create-order error]:', err);
    return NextResponse.json({ error: 'Unable to create payment order. Please try again.' }, { status: 502 });
  }
}
