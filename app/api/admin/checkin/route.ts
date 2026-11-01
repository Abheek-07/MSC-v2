import { NextResponse } from 'next/server';
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
    if (!limit.success) return noStoreJson({ error: 'Rate limit exceeded. Try again shortly.' }, 429, { 'Retry-After': '60' });

    const raw = await enforcePayloadSize(req, 8 * 1024);
    let body: Record<string, unknown>;
    try { body = JSON.parse(raw); } catch {
      return noStoreJson({ success: false, error: 'Invalid request body.' }, 400);
    }

    const eventId = typeof body.event_id === 'string' ? body.event_id : '';
    const token = typeof body.hash_payload === 'string' ? body.hash_payload.trim() : '';
    const memberId = typeof body.member_id === 'string' ? body.member_id.trim() : '';
    const teamMode = body.team_mode === 'all' ? 'all' : 'lead_only';
    if (!isValidUUID(eventId)) return noStoreJson({ success: false, error: 'A valid event_id is required.' }, 400);

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
      registrationId = token;
    } else if (token.length >= 5 && token.length <= 254 && /^[a-zA-Z0-9@._ -]+$/.test(token)) {
      const db = getAdminClient();
      const fields = token.includes('@')
        ? [['lead_email', token.toLowerCase()]]
        : [['form_data->>registration_number', token], ['form_data->>reg_num', token], ['form_data->>ticket_id', token]];
      for (const [field, value] of fields) {
        const found = await db.from('registrations').select('id')
          .eq('event_id', eventId).eq(field, value).eq('status', 'confirmed').limit(1).maybeSingle();
        if (found.error) throw found.error;
        if (found.data) { registrationId = found.data.id; break; }
      }
    }
    if (!registrationId) return noStoreJson({ success: false, error: 'No exact confirmed registration matched this ticket.' }, 404);

    const db = getAdminClient();
    const rpc = await db.rpc('checkin_registration', {
      p_event_id: eventId,
      p_registration_id: registrationId,
      p_team_mode: memberIndex !== null ? 'member' : teamMode,
      p_member_index: memberIndex
    });
    if (rpc.error) {
      console.error('[Atomic check-in RPC error]:', rpc.error.message);
      return noStoreJson({ success: false, error: 'Check-in is temporarily unavailable. Apply the atomic check-in migration first.' }, 503);
    }
    const result = rpc.data;
    if (!result?.success) return noStoreJson({ success: false, error: result?.error || 'Check-in was rejected.' }, 409);

    const members = Array.isArray(result.team_data?.members) ? result.team_data.members.map((member: any, index: number) => ({
      id: `${registrationId}-m-${index}`,
      name: member.fullName || member.name || 'Team member',
      email: member.email || '',
      reg_number: member.regNum || member.reg_number || member.registration_number || '',
      role: index === 0 ? 'Leader' : 'Member',
      checked_in: Boolean(member.checked_in)
    })) : [];
    return noStoreJson({
      success: true,
      already_checked_in: Boolean(result.already_checked_in),
      is_team: Boolean(result.team_data?.team_name),
      participant_name: result.form_data?.full_name || result.form_data?.name || String(result.lead_email || '').split('@')[0],
      registration_number: result.form_data?.registration_number || result.form_data?.reg_num || 'N/A',
      team_name: result.team_data?.team_name || '',
      team_members: members,
      message: result.already_checked_in ? 'This registration was already checked in.' : 'Check-in completed successfully.'
    });
  } catch (error) {
    console.error('[Admin check-in error]:', error);
    return noStoreJson({ success: false, error: 'Check-in failed due to a server error.' }, 500);
  }
}
