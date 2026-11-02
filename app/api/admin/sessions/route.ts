import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';
import { isValidUUID } from '@/lib/security';

export const dynamic = 'force-dynamic';

async function authorize() {
  const auth = await requireAdmin();
  if ('error' in auth) return { response: auth.error };
  const limit = await checkRateLimit(auth.user.id, 'admin');
  if (!limit.success) return { response: noStoreJson({ error: 'Rate limit exceeded.' }, 429, { 'Retry-After': '60' }) };
  return { auth };
}

export async function GET(req: Request) {
  try {
    const guarded = await authorize();
    if ('response' in guarded) return guarded.response;
    const eventId = new URL(req.url).searchParams.get('event_id') || '';
    if (!isValidUUID(eventId)) return noStoreJson({ error: 'A valid event_id is required.' }, 400);
    const db = getAdminClient();
    const { data: sessions, error } = await db.from('event_sessions')
      .select('id,event_id,title,description,location,starts_at,ends_at,is_active,created_at')
      .eq('event_id', eventId).order('starts_at', { ascending: true, nullsFirst: false });
    if (error) throw error;
    const ids = (sessions || []).map((s: any) => s.id);
    const counts: Record<string, number> = {};
    if (ids.length) {
      for (const sessionId of ids) {
        const { count, error: attendanceError } = await db.from('session_attendance')
          .select('id', { count: 'exact', head: true }).eq('session_id', sessionId);
        if (attendanceError) throw attendanceError;
        counts[sessionId] = count || 0;
      }
    }
    return noStoreJson({ success: true, sessions: (sessions || []).map((s: any) => ({ ...s, attendance_count: counts[s.id] || 0 })) });
  } catch (error) {
    console.error('[Admin sessions GET]', error);
    return noStoreJson({ error: 'Unable to load event sessions.' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const guarded = await authorize();
    if ('response' in guarded) return guarded.response;
    const body = await req.json();
    const eventId = typeof body.event_id === 'string' ? body.event_id : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!isValidUUID(eventId)) return noStoreJson({ error: 'A valid event_id is required.' }, 400);
    if (title.length < 2 || title.length > 120) return noStoreJson({ error: 'Session title must contain 2 to 120 characters.' }, 400);
    const startsAt = body.starts_at ? new Date(body.starts_at) : null;
    const endsAt = body.ends_at ? new Date(body.ends_at) : null;
    if ((startsAt && Number.isNaN(startsAt.getTime())) || (endsAt && Number.isNaN(endsAt.getTime()))) return noStoreJson({ error: 'Invalid session date/time.' }, 400);
    if (startsAt && endsAt && endsAt <= startsAt) return noStoreJson({ error: 'Session end must be after its start.' }, 400);
    const db = getAdminClient();
    const { data, error } = await db.from('event_sessions').insert({
      event_id: eventId,
      title,
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 2000) : null,
      location: typeof body.location === 'string' ? body.location.trim().slice(0, 200) : null,
      starts_at: startsAt?.toISOString() || null,
      ends_at: endsAt?.toISOString() || null,
      is_active: body.is_active !== false,
      created_by: guarded.auth.user.id,
    }).select().single();
    if (error) throw error;
    return noStoreJson({ success: true, session: data }, 201);
  } catch (error) {
    console.error('[Admin sessions POST]', error);
    return noStoreJson({ error: 'Unable to create session.' }, 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const guarded = await authorize();
    if ('response' in guarded) return guarded.response;
    const body = await req.json();
    const id = typeof body.id === 'string' ? body.id : '';
    if (!isValidUUID(id)) return noStoreJson({ error: 'A valid session id is required.' }, 400);
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.title === 'string') {
      const title = body.title.trim();
      if (title.length < 2 || title.length > 120) return noStoreJson({ error: 'Session title must contain 2 to 120 characters.' }, 400);
      updates.title = title;
    }
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;
    const db = getAdminClient();
    const { data, error } = await db.from('event_sessions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return noStoreJson({ success: true, session: data });
  } catch (error) {
    console.error('[Admin sessions PATCH]', error);
    return noStoreJson({ error: 'Unable to update session.' }, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const guarded = await authorize();
    if ('response' in guarded) return guarded.response;
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!isValidUUID(id)) return noStoreJson({ error: 'A valid session id is required.' }, 400);
    const db = getAdminClient();
    const { error } = await db.from('event_sessions').delete().eq('id', id);
    if (error) throw error;
    return noStoreJson({ success: true, id });
  } catch (error) {
    console.error('[Admin sessions DELETE]', error);
    return noStoreJson({ error: 'Unable to delete session.' }, 500);
  }
}
