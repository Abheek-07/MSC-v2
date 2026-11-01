import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';
import { sendTicketEmail } from '@/lib/email';
import { isValidUUID } from '@/lib/security';

export const dynamic = 'force-dynamic';

async function guard() {
  const auth = await requireAdmin();
  if ('error' in auth) return { response: auth.error };
  const limit = await checkRateLimit(auth.user.id, 'api');
  if (!limit.success) return { response: noStoreJson({ error: 'Rate limit exceeded.' }, 429) };
  return { user: auth.user };
}

export async function GET(req: Request) {
  try {
    const guarded = await guard();
    if ('response' in guarded) return guarded.response;
    const eventId = new URL(req.url).searchParams.get('event_id') || '';
    const db = getAdminClient();
    let query = db.from('registrations')
      .select('id,event_id,hash_payload,lead_email,status,form_data,team_data,events(title,date_start,location)')
      .order('created_at', { ascending: false }).limit(500);
    if (eventId) {
      if (!isValidUUID(eventId)) return noStoreJson({ error: 'Invalid event id.' }, 400);
      query = query.eq('event_id', eventId);
    }
    const { data, error } = await query;
    if (error) throw error;
    const registrations = (data || []).filter((row: any) => row.status === 'confirmed').map((row: any) => ({
      id: row.id,
      event_id: row.event_id,
      event_title: row.events?.title || 'MSC Event',
      event_date: row.events?.date_start || '',
      event_location: row.events?.location || '',
      lead_name: row.form_data?.full_name || row.form_data?.name || row.lead_email,
      lead_email: row.lead_email,
      hash_payload: row.hash_payload,
      team_name: row.team_data?.team_name || '',
      members: Array.isArray(row.team_data?.members) ? row.team_data.members.map((member: any, index: number) => ({
        index,
        name: member.fullName || member.name || 'Team member',
        email: member.email || '',
        hash_payload: member.hash_payload || '',
        role: member.role || (index === 0 ? 'Leader' : 'Member'),
      })) : [],
    }));
    return noStoreJson({ success: true, registrations });
  } catch (error) {
    console.error('[Admin tickets GET]', error);
    return noStoreJson({ error: 'Unable to load tickets.' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const guarded = await guard();
    if ('response' in guarded) return guarded.response;
    const body = await req.json();
    const registrationId = typeof body.registration_id === 'string' ? body.registration_id : '';
    const memberIndex = body.member_index === null || body.member_index === undefined ? null : Number(body.member_index);
    const action = body.action;
    if (!isValidUUID(registrationId) || (memberIndex !== null && (!Number.isInteger(memberIndex) || memberIndex < 0))) {
      return noStoreJson({ error: 'Invalid ticket selection.' }, 400);
    }
    if (!['regenerate', 'resend'].includes(action)) return noStoreJson({ error: 'Unsupported ticket action.' }, 400);

    const db = getAdminClient();
    const { data: registration, error } = await db.from('registrations')
      .select('id,event_id,hash_payload,lead_email,status,form_data,team_data,events(title,date_start,location)')
      .eq('id', registrationId).maybeSingle();
    if (error) throw error;
    if (!registration || registration.status !== 'confirmed') return noStoreJson({ error: 'Confirmed registration not found.' }, 404);

    const member = memberIndex === null ? null : registration.team_data?.members?.[memberIndex];
    if (memberIndex !== null && !member) return noStoreJson({ error: 'Team member not found.' }, 404);

    const attendeeName = member?.fullName || member?.name || registration.form_data?.full_name || registration.form_data?.name || registration.lead_email;
    const attendeeEmail = member?.email || registration.lead_email;
    if (!attendeeEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) {
      return noStoreJson({ error: 'A valid attendee email is not available for this ticket.' }, 409);
    }

    let token = member?.hash_payload || registration.hash_payload || registration.id;
    if (action === 'regenerate') {
      const newToken = randomUUID();
      const { data: result, error: rotateError } = await db.rpc('rotate_ticket_token', {
        p_registration_id: registrationId,
        p_member_index: memberIndex,
        p_new_token: newToken,
        p_actor_id: guarded.user.id,
      });
      if (rotateError) throw rotateError;
      if (!result?.success) return noStoreJson({ error: result?.error || 'Ticket regeneration failed.' }, 409);
      token = newToken;
    }

    const origin = new URL(req.url).origin;
    const ticketUrl = `${origin}/ticket/${token}`;
    const emailResult = await sendTicketEmail({
      to: attendeeEmail,
      name: attendeeName,
      eventTitle: registration.events?.title || 'MSC Event',
      eventDate: registration.events?.date_start || '',
      eventLocation: registration.events?.location || '',
      ticketUrl,
      qrPayload: token,
    });
    if (!emailResult.success) {
      return noStoreJson({ success: false, token_updated: action === 'regenerate', error: 'Ticket updated, but email delivery failed. Use the ticket link to share it manually.' }, 502);
    }
    return noStoreJson({ success: true, action, ticket_url: ticketUrl, email: attendeeEmail });
  } catch (error) {
    console.error('[Admin ticket action]', error);
    return noStoreJson({ error: 'Ticket action failed.' }, 500);
  }
}
