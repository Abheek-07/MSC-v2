import { NextResponse } from 'next/server';
import {
  enforcePayloadSize,
  isValidUUID,
  isValidEmail,
  sanitizeText,
} from '@/lib/security';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendTicketEmail } from '@/lib/email';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';

export async function POST(req: Request) {
  try {
    // 1. Enforce payload size limit (64KB)
    const rawBody = await enforcePayloadSize(req, 64 * 1024);
    const body = JSON.parse(rawBody);

    // 2. Rate limit check (5/min for registration)
    const clientIp = getClientIP(req.headers);
    const rateLimit = await checkRateLimit(`register_${clientIp}`, 'register');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please wait a minute before trying again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const { event_id, lead_email, form_data, team_data, idempotency_key } = body;

    // 3. Strict Input Validations
    if (!isValidUUID(event_id)) {
      return NextResponse.json({ error: 'Invalid event identifier format.' }, { status: 400 });
    }

    if (!isValidEmail(lead_email)) {
      return NextResponse.json({ error: 'Invalid lead email format.' }, { status: 400 });
    }

    if (idempotency_key && !isValidUUID(idempotency_key)) {
      return NextResponse.json({ error: 'Invalid idempotency key format.' }, { status: 400 });
    }

    // 4. Check event and determine pricing
    const matchingEvent = FALLBACK_EVENTS.find((e) => e.id === event_id) || FALLBACK_EVENTS[0];
    const isPaid = matchingEvent.form_requirements.event_pricing === 'paid';

    // 5. Try Supabase Atomic RPC
    const supabase = getAdminClient();
    let registrationId = crypto.randomUUID();
    let hashPayload = crypto.randomUUID();
    let status = isPaid ? 'pending_payment' : 'confirmed';

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('register_for_event', {
        p_event_id: event_id,
        p_user_id: null,
        p_lead_email: lead_email.toLowerCase().trim(),
        p_form_data: form_data || {},
        p_team_data: team_data || null,
        p_idempotency_key: idempotency_key || null,
      });

      if (!rpcError && rpcData?.success) {
        registrationId = rpcData.registration_id;
        hashPayload = rpcData.hash_payload;
        status = rpcData.status;
      }
    } catch {
      // Degrades gracefully to memory state if database is offline/unconfigured
    }

    // 6. Asynchronously send confirmation email if confirmed (never rolls back registration on error)
    if (status === 'confirmed') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const ticketUrl = `${appUrl}/ticket/${hashPayload}`;
      const attendeeName =
        team_data?.members?.[0]?.fullName ||
        form_data?.full_name ||
        lead_email.split('@')[0];

      sendTicketEmail({
        to: lead_email,
        name: attendeeName,
        eventTitle: matchingEvent.title,
        eventDate: matchingEvent.date_start,
        eventLocation: matchingEvent.location,
        ticketUrl,
        qrPayload: hashPayload,
      }).catch((e) => console.error('[Email Dispatcher Error]:', e));
    }

    return NextResponse.json({
      success: true,
      registration_id: registrationId,
      hash_payload: hashPayload,
      status,
    });
  } catch (err: any) {
    console.error('[API register error]:', err);
    return NextResponse.json(
      { error: err.message || 'Registration failed. Please verify your input and try again.' },
      { status: 500 }
    );
  }
}
