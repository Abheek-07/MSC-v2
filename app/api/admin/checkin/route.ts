import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { checkRateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  const rateLimit = await checkRateLimit(auth.user.id, 'api');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    const { event_id, hash_payload, team_mode } = await req.json();

    if (!hash_payload) {
      return NextResponse.json({ success: false, error: 'QR ticket token is required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // 1. Look up registration by hash_payload or id
    let query = supabase
      .from('registrations')
      .select('*, events(title)')
      .or(`hash_payload.eq.${hash_payload},id.eq.${hash_payload}`);

    if (event_id) {
      query = query.eq('event_id', event_id);
    }

    const { data: reg, error } = await query.maybeSingle();

    if (error) {
      console.error('Checkin query error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!reg) {
      return NextResponse.json(
        { success: false, error: 'Ticket not found in registration database for this event.' },
        { status: 404 }
      );
    }

    const participantName =
      reg.form_data?.full_name || reg.form_data?.name || reg.lead_email.split('@')[0];
    const registrationNumber =
      reg.form_data?.registration_number || reg.form_data?.reg_num || 'N/A';
    const teamName = reg.team_data?.team_name || '';
    const teamMembers = reg.team_data?.members || [];

    // 2. Check if already checked in
    if (reg.checked_in) {
      return NextResponse.json({
        success: true,
        already_checked_in: true,
        participant_name: participantName,
        registration_number: registrationNumber,
        team_name: teamName,
        team_members: teamMembers,
        checked_in_at: new Date(reg.updated_at || reg.created_at).toLocaleTimeString(),
      });
    }

    // 3. Mark checked in in Supabase
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        checked_in: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reg.id);

    if (updateError) {
      console.error('Checkin update error:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      already_checked_in: false,
      participant_name: participantName,
      registration_number: registrationNumber,
      team_name: teamName,
      team_members: teamMembers,
    });
  } catch (err: any) {
    console.error('Checkin API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
