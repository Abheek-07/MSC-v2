import { NextResponse } from 'next/server';
import { enforcePayloadSize, isValidUUID } from '@/lib/security';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { getRazorpayClient } from '@/lib/razorpay';
import { getAdminClient } from '@/lib/supabase/admin';

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

    // Derive the event, registration and amount from trusted database records.
    const supabase = getAdminClient();
    const { data: registration, error: registrationError } = await supabase
      .from('registrations')
      .select('id, event_id, status')
      .eq('id', registrationId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (registrationError) throw registrationError;
    if (!registration) {
      return NextResponse.json({ error: 'Registration not found for this event.' }, { status: 404 });
    }
    if (registration.status === 'confirmed') {
      return NextResponse.json({ error: 'This registration is already confirmed.' }, { status: 409 });
    }
    if (!['pending', 'reserved', 'awaiting_payment'].includes(String(registration.status))) {
      return NextResponse.json({ error: 'This registration is not eligible for payment.' }, { status: 409 });
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, form_requirements')
      .eq('id', eventId)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

    const fee = Number(event.form_requirements?.registration_fee);
    if (!Number.isSafeInteger(fee) || fee <= 0) {
      return NextResponse.json({ error: 'A valid registration fee is not configured for this event.' }, { status: 409 });
    }

    const amountInPaise = fee * 100;
    if (!Number.isSafeInteger(amountInPaise)) {
      return NextResponse.json({ error: 'Configured registration fee is invalid.' }, { status: 500 });
    }

    // Never fabricate an order ID when Razorpay is unavailable.
    const order = await getRazorpayClient().orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `msc_${registration.id.replace(/-/g, '').slice(0, 20)}_${Date.now().toString(36)}`,
      notes: { event_id: String(eventId), registration_id: String(registrationId) },
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('[Razorpay create-order error]:', err);
    return NextResponse.json({ error: 'Unable to create payment order. Please try again.' }, { status: 502 });
  }
}
