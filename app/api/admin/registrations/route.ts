import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';
import { randomUUID } from 'node:crypto';
import { enforcePayloadSize } from '@/lib/security';

function ensureTeamMemberQrTokens(teamData: any) {
  if (!teamData || !Array.isArray(teamData.members)) return teamData;
  return {
    ...teamData,
    members: teamData.members.map((member: any) => {
      if (!member || typeof member !== 'object' || Array.isArray(member)) return member;
      const existingToken = typeof member.hash_payload === 'string' ? member.hash_payload.trim() : '';
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingToken);
      return { ...member, hash_payload: isUuid ? existingToken : randomUUID() };
    }),
  };
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const rateLimit = await checkRateLimit(auth.user.id, 'admin');
    if (!rateLimit.success) {
      return noStoreJson(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        429,
        { 'Retry-After': '60' }
      );
    }
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    const supabase = getAdminClient();
    let query = supabase
      .from('registrations')
      .select('*, events(title)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const registrations = (data || []).map((r: any) => ({
      id: r.id,
      hash_payload: r.hash_payload || r.id,
      event_id: r.event_id,
      event_title: r.events?.title || 'SYNORA',
      lead_name: r.form_data?.full_name || r.form_data?.name || r.lead_email.split('@')[0],
      lead_email: r.lead_email,
      reg_number: r.form_data?.registration_number || r.form_data?.reg_num || 'N/A',
      phone: r.form_data?.phone || '',
      college: r.form_data?.college || 'SRM University AP',
      team_name: r.team_data?.team_name || '',
      team_members: r.team_data?.members || [],
      checked_in: Boolean(r.checked_in),
      status: r.status,
      created_at: r.created_at,
    }));

    return noStoreJson({ success: true, registrations, total_count: count ?? registrations.length });
  } catch (err: any) {
    console.error('Error fetching admin registrations:', err);
    return noStoreJson({ error: err.message }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const rateLimit = await checkRateLimit(auth.user.id, 'admin');
    if (!rateLimit.success) {
      return noStoreJson(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        429,
        { 'Retry-After': '60' }
      );
    }

    const rawBody = await enforcePayloadSize(req, 1024 * 1024);
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return noStoreJson({ error: 'Invalid JSON request body' }, 400);
    }
    const supabase = getAdminClient();

    // 1. Atomic bulk import. The database function performs clear + upsert
    // in one transaction, so a failure rolls back the entire operation.
    const batchList = Array.isArray(body)
      ? body
      : (body && Array.isArray(body.batch) ? body.batch : null);

    if (batchList) {
      const MAX_IMPORT_ROWS = 500;
      if (batchList.length === 0) {
        return noStoreJson({ error: 'The import batch is empty' }, 400);
      }
      if (batchList.length > MAX_IMPORT_ROWS) {
        return noStoreJson({ error: `A maximum of ${MAX_IMPORT_ROWS} registrations can be imported at once` }, 413);
      }

      const seen = new Set<string>();
      const rows = [];
      for (let i = 0; i < batchList.length; i++) {
        const item = batchList[i];
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return noStoreJson({ error: `Invalid registration at row ${i + 1}` }, 400);
        }

        const eventId = typeof item.event_id === 'string' ? item.event_id.trim() : '';
        const rawEmail = item.lead_email || item.Email || item.email;
        const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
        if (!eventId || !email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return noStoreJson({ error: `A valid event_id and email are required at row ${i + 1}` }, 400);
        }

        const key = `${eventId}:${email}`;
        if (seen.has(key)) {
          return noStoreJson({ error: `Duplicate event/email pair at row ${i + 1}: ${email}` }, 400);
        }
        seen.add(key);

        const status = item.status || 'confirmed';
        if (!['pending_payment', 'confirmed', 'waitlisted', 'cancelled'].includes(status)) {
          return noStoreJson({ error: `Invalid registration status at row ${i + 1}` }, 400);
        }

        rows.push({
          event_id: eventId,
          lead_email: email,
          status,
          checked_in: Boolean(item.checked_in),
          form_data: item.form_data && typeof item.form_data === 'object'
            ? item.form_data
            : {
                full_name: item.full_name || item.lead_name || item.Name || item.name || 'Imported Participant',
                registration_number: item.registration_number || item.reg_number || item.RegNum || item.reg_num || 'AP0000000000',
                phone: item.phone || item.Phone || '',
                college: item.college || item.College || 'SRM University AP',
              },
          team_data: ensureTeamMemberQrTokens(item.team_data || (
            item.team_name || item.Team || item.team
              ? { team_name: item.team_name || item.Team || item.team }
              : null
          )),
          created_at: item.created_at || new Date().toISOString(),
        });
      }

      const { data, error } = await supabase.rpc('admin_import_registrations', {
        p_rows: rows,
        p_clear_first: Boolean(!Array.isArray(body) && body.clear_first),
      });

      if (error) {
        console.error('Atomic registration import failed:', error);
        return noStoreJson({ error: 'Import failed. Existing registrations were not changed.' }, 500);
      }

      return noStoreJson({
        success: true,
        count: data?.processed_count ?? rows.length,
        cleared_first: Boolean(!Array.isArray(body) && body.clear_first),
        message: 'Registrations imported successfully.',
      });
    }

    // 2. Single registration creation/update.
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return noStoreJson({ error: 'Invalid request body' }, 400);
    }
    const { event_id, lead_email, full_name, registration_number, phone, college, team_name, checked_in } = body;
    if (!event_id || typeof lead_email !== 'string') {
      return noStoreJson({ error: 'event_id and lead_email are required' }, 400);
    }

    const cleanEmail = lead_email.toLowerCase().trim();
    if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return noStoreJson({ error: 'A valid email address is required' }, 400);
    }

    const { data: existingSingle, error: lookupError } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', event_id)
      .eq('lead_email', cleanEmail)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (existingSingle) {
      const { data, error } = await supabase
        .from('registrations')
        .update({
          form_data: {
            full_name: full_name || cleanEmail.split('@')[0],
            registration_number: registration_number || 'AP0000000000',
            phone: phone || '',
            college: college || 'SRM University AP',
          },
          team_data: team_name ? { team_name } : null,
          checked_in: Boolean(checked_in),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSingle.id)
        .select()
        .single();
      if (error) throw error;
      return noStoreJson({ success: true, registration: data, updated: true });
    }

    const { data, error } = await supabase
      .from('registrations')
      .insert({
        event_id,
        lead_email: cleanEmail,
        status: 'confirmed',
        checked_in: Boolean(checked_in),
        form_data: {
          full_name: full_name || cleanEmail.split('@')[0],
          registration_number: registration_number || 'AP0000000000',
          phone: phone || '',
          college: college || 'SRM University AP',
        },
        team_data: team_name ? { team_name } : null,
      })
      .select()
      .single();
    if (error) throw error;

    return noStoreJson({ success: true, registration: data });
  } catch (err: any) {
    console.error('Error creating registration:', err);
    return noStoreJson({ error: 'Failed to process registration import' }, 500);
  }
}
export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');
    const regId = searchParams.get('id');

    const supabase = getAdminClient();

    if (eventId) {
      const { error, count } = await supabase
        .from('registrations')
        .delete({ count: 'exact' })
        .eq('event_id', eventId);

      if (error) throw error;
      return noStoreJson({
        success: true,
        count: count || 0,
        message: `Successfully deleted all attendees for event`,
      });
    }

    if (regId) {
      const { error } = await supabase
        .from('registrations')
        .delete()
        .eq('id', regId);

      if (error) throw error;
      return noStoreJson({ success: true, message: 'Attendee deleted successfully' });
    }

    return noStoreJson({ error: 'event_id or id query parameter is required' }, 400);
  } catch (err: any) {
    console.error('Delete registration error:', err);
    return noStoreJson({ error: err.message }, 500);
  }
}
