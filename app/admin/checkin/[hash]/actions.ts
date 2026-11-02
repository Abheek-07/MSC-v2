'use server';

import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';
import { isValidUUID } from '@/lib/security';

export interface ActionResponse {
  success: boolean;
  error?: string;
  message?: string;
}

async function authorizeAction() {
  const auth = await requireAdmin();
  if ('error' in auth) return { error: 'Admin access required.' };
  const limit = await checkRateLimit(auth.user.id, 'admin');
  if (!limit.success) return { error: 'Too many check-in actions. Try again shortly.' };
  return { userId: auth.user.id };
}

export async function checkInTeamServerAction(eventId: string, teamName: string, teamId?: string): Promise<ActionResponse> {
  try {
    const auth = await authorizeAction();
    if ('error' in auth) return { success: false, error: auth.error };
    if (!isValidUUID(eventId) || (!teamId && (!teamName || teamName.length > 120))) {
      return { success: false, error: 'Invalid event or team identifier.' };
    }

    const db = getAdminClient();
    let query = db.from('registrations').select('id').eq('event_id', eventId);
    query = teamId
      ? query.eq('team_data->>team_id', teamId)
      : query.eq('team_data->>team_name', teamName);
    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw error;
    if (!data) return { success: false, error: 'Team registration not found.' };

    const result = await db.rpc('checkin_registration', {
      p_event_id: eventId,
      p_registration_id: data.id,
      p_team_mode: 'all',
      p_member_index: null
    });
    if (result.error) throw result.error;
    if (!result.data?.success) return { success: false, error: result.data?.error || 'Team check-in rejected.' };
    return { success: true, message: result.data.already_checked_in ? 'Team was already checked in.' : 'Entire team checked in successfully!' };
  } catch (error) {
    console.error('[Team check-in action]:', error);
    return { success: false, error: 'Team check-in failed.' };
  }
}

export async function checkInMemberServerAction(memberIdentifier: string): Promise<ActionResponse> {
  try {
    const auth = await authorizeAction();
    if ('error' in auth) return { success: false, error: auth.error };

    const embedded = memberIdentifier.match(/^([0-9a-f-]{36})-m-(\d+)$/i);
    const registrationId = embedded ? embedded[1] : memberIdentifier;
    const memberIndex = embedded ? Number(embedded[2]) : null;
    if (!isValidUUID(registrationId)) return { success: false, error: 'Invalid registration identifier.' };

    const db = getAdminClient();
    const { data: registration, error } = await db.from('registrations')
      .select('id,event_id')
      .eq('id', registrationId)
      .maybeSingle();
    if (error) throw error;
    if (!registration) return { success: false, error: 'Registration not found.' };

    const result = await db.rpc('checkin_registration', {
      p_event_id: registration.event_id,
      p_registration_id: registration.id,
      p_team_mode: memberIndex !== null ? 'member' : 'lead_only',
      p_member_index: memberIndex
    });
    if (result.error) throw result.error;
    if (!result.data?.success) return { success: false, error: result.data?.error || 'Attendee check-in rejected.' };
    return { success: true, message: result.data.already_checked_in ? 'Attendee was already checked in.' : 'Attendee admission recorded!' };
  } catch (error) {
    console.error('[Member check-in action]:', error);
    return { success: false, error: 'Attendee check-in failed.' };
  }
}
