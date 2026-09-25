import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('member_profiles')
      .select('id, email, full_name, role, is_onboarded, department, year_of_study, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, members: data || [] });
  } catch (err: any) {
    console.error('Error fetching member roles:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user_id, role } = await req.json();

    if (!user_id || !['admin', 'core_member', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user ID or role specified' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error } = await supabase
      .from('member_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', user_id);

    if (error) throw error;

    return NextResponse.json({ success: true, user_id, role });
  } catch (err: any) {
    console.error('Error updating member role:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
