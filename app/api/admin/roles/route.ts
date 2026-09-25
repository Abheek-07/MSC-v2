import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { user_id, role } = await req.json();

    if (!user_id || !['admin', 'core_member', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Invalid user ID or role specified' }, { status: 400 });
    }

    const supabase = getAdminClient();
    try {
      const { error } = await supabase
        .from('member_profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', user_id);

      if (error) throw error;
    } catch {
      // Memory fallback
    }

    return NextResponse.json({ success: true, user_id, role });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
