import { NextResponse } from 'next/server';
import { enforcePayloadSize, isValidUUID, isValidEmail } from '@/lib/security';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendTicketEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const rawBody = await enforcePayloadSize(req, 64 * 1024);
    let body: Record<string, any>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const clientIp = getClientIP(req.headers);
    const rateLimit = await checkRateLimit(`register_${clientIp}`, 'register');
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many registration requests. Please wait a minute before trying again.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const { event_id, lead_email, form_data, team_data, idempotency_key } = body;
    if (!isValidUUID(event_id)) {
      return NextResponse.json({ error: 'Invalid event identifier format.' }, { status: 400 });
    }
    if (!isValidEmail(lead_email)) {
      return NextResponse.json({ error: 'Invalid lead email format.' }, { status: 400 });
    }
    if (idempotency_key && !isValidUUID(idempotency_key)) {
      return NextResponse.json({ error: 'Invalid idempotency key format.' }, { status: 400 });
    }
    if (form_data !== undefined && (!form_data || typeof form_data !== 'object' || Array.isArray(form_data))) {
      return NextResponse.json({ error: 'Invalid registration form data.' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const normalizedEmail = lead_email.toLowerCase().trim();

    // Read event metadata for business rules and confirmation email.
    // Capacity and insert are intentionally NOT checked here; the database RPC
    // locks the event row and performs both operations in one transaction.
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title, date_start, date_end, location, status, registration_open, form_requirements')
      .eq('id', event_id)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) return NextResponse.json({ error: 'Event not found.' }, { status: 404 });

    const isEventCompleted =
      event.status === 'completed' ||
      Boolean(event.date_end && new Date(event.date_end).getTime() < Date.now());

    if (isEventCompleted || !event.registration_open) {
      return NextResponse.json({ error: 'Registrations are closed for this event.' }, { status: 400 });
    }

    const requestedTeamName = String(team_data?.team_name || team_data?.teamName || '').trim();
    const members = Array.isArray(team_data?.members) ? team_data.members.map((member: any) => ({
      fullName: String(member.fullName || member.name || '').trim(),
      email: typeof member.email === 'string' ? member.email.toLowerCase().trim() : '',
      regNum: String(member.regNum || member.reg_number || '').trim(),
      year: String(member.year || ''),
      branch: String(member.branch || ''),
      checked_in: false,
    })) : [];

    const normalizedTeamData = requestedTeamName ? {
      team_name: requestedTeamName,
      members,
      looking_for_members: Boolean(team_data?.looking_for_members ?? team_data?.lookingForMembers),
      leader_name: String(form_data?.full_name || ''),
      leader_year: String(form_data?.year || ''),
      leader_branch: String(form_data?.branch || ''),
      leadIndex: 0,
    } : null;

    const effectiveIdempotencyKey = idempotency_key || crypto.randomUUID();
    const { data: result, error: registrationError } = await supabase.rpc('register_for_event', {
      p_event_id: event_id,
      p_user_id: null,
      p_lead_email: normalizedEmail,
      p_form_data: form_data || {},
      p_team_data: normalizedTeamData,
      p_idempotency_key: effectiveIdempotencyKey,
    });

    if (registrationError) {
      console.error('[Registration RPC failed]:', registrationError.message);
      return NextResponse.json({ error: 'Registration could not be completed. Please retry.' }, { status: 503 });
    }
    if (!result || result.success !== true) {
      return NextResponse.json({ error: result?.error || 'Registration was rejected.' }, { status: 409 });
    }

    const registrationId = result.registration_id;
    const hashPayload = result.hash_payload;
    const status = result.status;

    // Do not dispatch duplicate confirmation emails when an idempotent request replays.
    if (status === 'confirmed' && !result.replayed && hashPayload) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mscsrmap.xyz';
      const attendeeName = members[0]?.fullName || form_data?.full_name || normalizedEmail.split('@')[0];

      sendTicketEmail({
        to: normalizedEmail,
        name: attendeeName,
        eventTitle: event.title,
        eventDate: event.date_start,
        eventLocation: event.location,
        ticketUrl: `${appUrl}/ticket/${hashPayload}`,
        qrPayload: hashPayload,
      }).catch((error) => console.error('[Ticket email dispatcher]:', error));
    }

    return NextResponse.json({
      success: true,
      registration_id: registrationId,
      hash_payload: hashPayload,
      status,
      replayed: Boolean(result.replayed),
      reservation_expires_at: result.reservation_expires_at || null,
    });
  } catch (err) {
    console.error('[API register error]:', err);
    return NextResponse.json({ error: 'Registration failed due to server error.' }, { status: 500 });
  }
}
