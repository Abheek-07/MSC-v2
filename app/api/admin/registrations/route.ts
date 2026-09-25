import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('event_id');
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    const supabase = getAdminClient();
    let query = supabase
      .from('registrations')
      .select('*, events(title)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query;
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

    return NextResponse.json({ success: true, registrations });
  } catch (err: any) {
    console.error('Error fetching admin registrations:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event_id, lead_email, full_name, registration_number, phone, college, team_name } = body;

    if (!event_id || !lead_email) {
      return NextResponse.json({ error: 'event_id and lead_email are required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('registrations')
      .insert({
        event_id,
        lead_email,
        status: 'confirmed',
        checked_in: false,
        form_data: {
          full_name: full_name || lead_email.split('@')[0],
          registration_number: registration_number || 'AP0000000000',
          phone: phone || '',
          college: college || 'SRM University AP',
        },
        team_data: team_name ? { team_name } : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, registration: data });
  } catch (err: any) {
    console.error('Error creating registration:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
