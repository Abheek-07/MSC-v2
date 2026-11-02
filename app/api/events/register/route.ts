import { NextResponse } from 'next/server';
import { enforcePayloadSize, isValidUUID, isValidEmail } from '@/lib/security';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { getAdminClient } from '@/lib/supabase/admin';
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

    const isPaidEvent = event.form_requirements?.event_pricing === 'paid';
    if (isPaidEvent && body.no_refund_policy_accepted !== true) {
      return NextResponse.json(
        { error: 'You must accept the no-refund policy before registering for a paid event.' },
        { status: 400 }
      );
    }

    const normalizedFormData = {
      ...(form_data || {}),
      ...(isPaidEvent ? {
        no_refund_policy_accepted: true,
        no_refund_policy_version: '2026-11-01',
        no_refund_policy_accepted_at: new Date().toISOString(),
      } : {}),
    };

    const requestedTeamName = String(team_data?.team_name || team_data?.teamName || '').trim();
    const members = Array.isArray(team_data?.members) ? team_data.members.map((member: any) => ({
      fullName: String(member.fullName || member.name || '').trim(),
      email: typeof member.email === 'string' ? member.email.toLowerCase().trim() : '',
      regNum: String(member.regNum || member.reg_number || '').trim(),
      year: String(member.year || ''),
      branch: String(member.branch || ''),
      checked_in: false,
      hash_payload: crypto.randomUUID(),
    })) : [];

    // The team leader is also an individual attendee and must have their own QR.
    if (requestedTeamName && !members.some((member: any) => member.email === normalizedEmail)) {
      members.unshift({
        fullName: String(form_data?.full_name || normalizedEmail.split('@')[0]),
        email: normalizedEmail,
        regNum: String(form_data?.registration_number || form_data?.reg_num || ''),
        year: String(form_data?.year || ''),
        branch: String(form_data?.branch || ''),
        checked_in: false,
        hash_payload: crypto.randomUUID(),
      });
    }

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
      p_form_data: normalizedFormData,
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

    return NextResponse.json({
      success: true,
      registration_id: registrationId,
      hash_payload: hashPayload,
      ticket_url: hashPayload ? `/ticket/${hashPayload}` : null,
      status,
      replayed: Boolean(result.replayed),
      reservation_expires_at: result.reservation_expires_at || null,
    });
  } catch (err) {
    console.error('[API register error]:', err);
    return NextResponse.json({ error: 'Registration failed due to server error.' }, { status: 500 });
  }
}
