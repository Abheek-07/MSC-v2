import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('member_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, users: data || [] });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    return NextResponse.json({ error: err.message, users: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, password, full_name, role, department, year } = await req.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { error: 'Valid email and password (minimum 8 characters) required' },
        { status: 400 }
      );
    }

    const assignedRole = role === 'admin' ? 'admin' : 'core_member';
    const supabase = getAdminClient();

    // Provision user via Supabase Auth Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: assignedRole },
    });

    if (authError) {
      console.error('Supabase Auth user creation error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (authUser?.user) {
      const { data: profile, error: profError } = await supabase
        .from('member_profiles')
        .upsert({
          id: authUser.user.id,
          email,
          full_name: full_name || email.split('@')[0],
          role: assignedRole,
          department: department || 'CSE',
          year_of_study: year || '3rd Year',
          is_onboarded: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (profError) {
        console.error('Profile creation error:', profError);
      }

      return NextResponse.json({ success: true, user: profile || authUser.user });
    }

    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  } catch (err: any) {
    console.error('Admin provision user error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { user_id, action, role, new_password } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    if (action === 'update_role' && role) {
      const { error } = await supabase
        .from('member_profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', user_id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Role updated successfully' });
    }

    if (action === 'reset_password' && new_password) {
      const { error } = await supabase.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Password reset successfully' });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: any) {
    console.error('Admin user update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);
    if (authErr) {
      console.warn('Auth user delete warning:', authErr.message);
    }
    const { error: profErr } = await supabase.from('member_profiles').delete().eq('id', userId);
    if (profErr) {
      console.warn('Profile delete warning:', profErr.message);
    }

    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (err: any) {
    console.error('Admin user delete error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
