import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';
import { isValidUUID } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const limit = await checkRateLimit(auth.user.id, 'api');
    if (!limit.success) return noStoreJson({ error: 'Rate limit exceeded.' }, 429, { 'Retry-After': '60' });

    const sessionId = new URL(req.url).searchParams.get('session_id') || '';
    if (!isValidUUID(sessionId)) return noStoreJson({ error: 'A valid session_id is required.' }, 400);

    const db = getAdminClient();
    const { data, error } = await db.from('session_attendance')
      .select('id,checked_in_at,attendee_token,member_index,registrations!inner(id,event_id,form_data,lead_email,team_data)')
      .eq('session_id', sessionId)
      .order('checked_in_at', { ascending: false });
    if (error) throw error;

    const attendees = (data || []).map((row: any) => {
      const registration = row.registrations || {};
      const member = Number.isInteger(row.member_index) ? registration.team_data?.members?.[row.member_index] : null;
      return {
        id: row.id,
        checked_in_at: row.checked_in_at,
        name: member?.fullName || member?.name || registration.form_data?.full_name || registration.form_data?.name || String(registration.lead_email || '').split('@')[0],
        email: member?.email || registration.lead_email || '',
        registration_number: member?.regNum || member?.reg_number || member?.registration_number || registration.form_data?.registration_number || registration.form_data?.reg_num || 'N/A',
        team_name: registration.team_data?.team_name || '',
      };
    });
    return noStoreJson({ success: true, attendees });
  } catch (error) {
    console.error('[Session attendance list]', error);
    return noStoreJson({ error: 'Unable to load session attendance.' }, 500);
  }
}
