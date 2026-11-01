import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';
import { enforcePayloadSize, isValidUUID } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const limit = await checkRateLimit(auth.user.id, 'api');
    if (!limit.success) return noStoreJson({ error: 'Rate limit exceeded.' }, 429, { 'Retry-After': '60' });

    const raw = await enforcePayloadSize(req, 8192);
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw); } catch { return noStoreJson({ success: false, error: 'Invalid request body.' }, 400); }

    const eventId = typeof body.event_id === 'string' ? body.event_id : '';
    const sessionId = typeof body.session_id === 'string' ? body.session_id : '';
    const token = typeof body.hash_payload === 'string' ? body.hash_payload.trim() : '';
    const memberId = typeof body.member_id === 'string' ? body.member_id.trim() : '';
    if (!isValidUUID(eventId) || !isValidUUID(sessionId)) return noStoreJson({ success: false, error: 'Valid event_id and session_id are required.' }, 400);

    const db = getAdminClient();
    const { data: session, error: sessionError } = await db.from('event_sessions')
      .select('id,event_id,title,is_active').eq('id', sessionId).eq('event_id', eventId).maybeSingle();
    if (sessionError) throw sessionError;
    if (!session || !session.is_active) return noStoreJson({ success: false, error: 'Session not found or inactive.' }, 404);

    let registrationId = '';
    let memberIndex: number | null = null;
    if (memberId) {
      const match = memberId.match(/^([0-9a-f-]{36})-m-(\d+)$/i);
      if (match && isValidUUID(match[1])) {
        registrationId = match[1];
        memberIndex = Number(match[2]);
      } else if (isValidUUID(memberId)) {
        registrationId = memberId;
      } else {
        return noStoreJson({ success: false, error: 'Invalid member identifier.' }, 400);
      }
    } else if (isValidUUID(token)) {
      const top = await db.from('registrations').select('id,hash_payload,form_data,team_data,lead_email,status')
        .eq('event_id', eventId).eq('hash_payload', token).maybeSingle();
      if (top.error) throw top.error;
      if (top.data) registrationId = top.data.id;
      if (!registrationId) {
        const byId = await db.from('registrations').select('id,hash_payload,form_data,team_data,lead_email,status')
          .eq('event_id', eventId).eq('id', token).maybeSingle();
        if (byId.error) throw byId.error;
        if (byId.data) registrationId = byId.data.id;
      }
      if (!registrationId) {
        const matches = await db.from('registrations').select('id,hash_payload,form_data,team_data,lead_email,status')
          .eq('event_id', eventId).eq('status', 'confirmed')
          .contains('team_data', { members: [{ hash_payload: token }] }).limit(2);
        if (matches.error) throw matches.error;
        const found = (matches.data || []).flatMap((row: any) => (row.team_data?.members || [])
          .map((member: any, index: number) => ({ row, member, index }))
          .filter((entry: any) => entry.member.hash_payload === token));
        if (found.length > 1) return noStoreJson({ success: false, error: 'Duplicate member ticket token.' }, 409);
        if (found.length === 1) {
          registrationId = found[0].row.id;
          memberIndex = found[0].index;
        }
      }
    }
    if (!registrationId) return noStoreJson({ success: false, error: 'No exact registration matched this ticket.' }, 404);
    if (token && isValidUUID(token)) {
      const { data: revokedToken, error: revokedError } = await db.from('ticket_token_revocations')
        .select('id').eq('token', token).maybeSingle();
      if (revokedError) throw revokedError;
      if (revokedToken) return noStoreJson({ success: false, error: 'This ticket QR has been revoked. Ask the attendee for their latest ticket.' }, 409);
    }

    const { data: registration, error: registrationError } = await db.from('registrations')
      .select('id,event_id,status,hash_payload,lead_email,form_data,team_data')
      .eq('id', registrationId).eq('event_id', eventId).maybeSingle();
    if (registrationError) throw registrationError;
    if (!registration || registration.status !== 'confirmed') return noStoreJson({ success: false, error: 'Registration is not confirmed.' }, 409);

    let attendeeToken = token;
    if (memberIndex !== null) {
      const member = registration.team_data?.members?.[memberIndex];
      if (!member || !isValidUUID(member.hash_payload)) return noStoreJson({ success: false, error: 'Member ticket token is missing. Run the individual QR migration.' }, 409);
      attendeeToken = member.hash_payload;
    } else if (!attendeeToken || (attendeeToken !== registration.hash_payload && attendeeToken !== registration.id)) {
      attendeeToken = registration.hash_payload || registration.id;
    }

    if (attendeeToken && isValidUUID(attendeeToken)) {
      const { data: revokedAttendeeToken, error: revokedAttendeeError } = await db.from('ticket_token_revocations')
        .select('id').eq('token', attendeeToken).maybeSingle();
      if (revokedAttendeeError) throw revokedAttendeeError;
      if (revokedAttendeeToken) return noStoreJson({ success: false, error: 'This ticket QR has been revoked. Ask the attendee for their latest ticket.' }, 409);
    }

    const isTeamRoot = memberIndex === null && Boolean(registration.team_data?.team_name) && Array.isArray(registration.team_data?.members) && registration.team_data.members.length > 0;
    if (isTeamRoot) {
      const leader = registration.team_data.members[0];
      if (!leader || !isValidUUID(leader.hash_payload)) return noStoreJson({ success: false, error: 'Team leader ticket token is missing. Run the individual QR migration.' }, 409);
      memberIndex = 0;
      attendeeToken = leader.hash_payload;
    }

    const matchedMember = memberIndex !== null ? registration.team_data?.members?.[memberIndex] : null;
    const participantName = matchedMember?.fullName || matchedMember?.name || registration.form_data?.full_name || registration.form_data?.name || String(registration.lead_email || '').split('@')[0];
    const participantRegNumber = matchedMember?.regNum || matchedMember?.reg_number || matchedMember?.registration_number || registration.form_data?.registration_number || registration.form_data?.reg_num || 'N/A';

    if (body.preview === true) {
      const relevantTokens = [attendeeToken, ...(Array.isArray(registration.team_data?.members) ? registration.team_data.members.map((member: any) => member.hash_payload).filter((value: any) => typeof value === 'string') : [])];
      const { data: attendanceRows, error: attendanceError } = await db.from('session_attendance')
        .select('attendee_token').eq('session_id', sessionId).in('attendee_token', Array.from(new Set(relevantTokens)));
      if (attendanceError) throw attendanceError;
      const attended = new Set((attendanceRows || []).map((row: any) => row.attendee_token));
      const members = Array.isArray(registration.team_data?.members) ? registration.team_data.members.map((m: any, index: number) => ({
        id: registration.id + '-m-' + index,
        name: m.fullName || m.name || 'Team member',
        email: m.email || '',
        reg_number: m.regNum || m.reg_number || m.registration_number || '',
        checked_in: attended.has(m.hash_payload),
      })) : [];
      return noStoreJson({
        success: true,
        is_team: isTeamRoot || (memberIndex === null && Boolean(registration.team_data?.team_name)),
        participant_name: participantName,
        registration_number: participantRegNumber,
        team_name: registration.team_data?.team_name || '',
        team_members: members,
        already_checked_in: attended.has(attendeeToken),
        session_title: session.title,
      });
    }

    const rpc = await db.rpc('record_session_attendance', {
      p_session_id: sessionId,
      p_registration_id: registrationId,
      p_attendee_token: attendeeToken,
      p_member_index: memberIndex,
      p_checked_in_by: auth.user.id,
    });
    if (rpc.error) throw rpc.error;
    if (!rpc.data?.success) return noStoreJson({ success: false, error: rpc.data?.error || 'Session check-in rejected.' }, 409);

    return noStoreJson({
      success: true,
      already_checked_in: Boolean(rpc.data.already_checked_in),
      participant_name: participantName,
      registration_number: participantRegNumber,
      team_name: registration.team_data?.team_name || '',
      session_title: session.title,
      checked_in_at: rpc.data.checked_in_at,
      message: rpc.data.already_checked_in ? 'Already checked into this session.' : 'Session attendance recorded.',
    });
  } catch (error) {
    console.error('[Session check-in error]', error);
    return noStoreJson({ success: false, error: 'Session check-in failed.' }, 500);
  }
}
