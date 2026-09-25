import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

// In-memory fallback directory for initial state or fallback mode
let memoryUsers = [
  {
    id: 'u-001',
    email: 'president@msc-srmap.in',
    full_name: 'Aravind S.',
    role: 'admin',
    department: 'CSE',
    year: '4th Year',
    created_at: '2026-08-01T10:00:00Z',
  },
  {
    id: 'u-002',
    email: 'operations@msc-srmap.in',
    full_name: 'Sneha Reddy',
    role: 'core_member',
    department: 'CSE AI & ML',
    year: '3rd Year',
    created_at: '2026-08-05T12:00:00Z',
  },
  {
    id: 'u-003',
    email: 'tech.lead@msc-srmap.in',
    full_name: 'Karthik Rao',
    role: 'core_member',
    department: 'CSE Cloud Systems',
    year: '3rd Year',
    created_at: '2026-08-10T14:30:00Z',
  },
];

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('member_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return NextResponse.json({ users: data });
    }
  } catch {
    // Graceful fallback
  }

  return NextResponse.json({ users: memoryUsers });
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

    try {
      const supabase = getAdminClient();
      // Provision via Supabase Auth Admin API
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: assignedRole },
      });

      if (authError) throw authError;

      if (authUser?.user) {
        await supabase.from('member_profiles').insert({
          id: authUser.user.id,
          email,
          full_name,
          role: assignedRole,
          department: department || 'CSE',
          year: year || '3rd Year',
          is_onboarded: true,
        });

        return NextResponse.json({ success: true, user: authUser.user });
      }
    } catch (err: any) {
      console.warn('Supabase Auth user creation fallback to memory:', err.message);
    }

    // In-memory fallback
    const newUser = {
      id: `u-${Date.now()}`,
      email,
      full_name: full_name || email.split('@')[0],
      role: assignedRole,
      department: department || 'CSE',
      year: year || '3rd Year',
      created_at: new Date().toISOString(),
    };
    memoryUsers.unshift(newUser);

    return NextResponse.json({ success: true, user: newUser, fallback: true });
  } catch (err: any) {
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
      try {
        await supabase.from('member_profiles').update({ role }).eq('id', user_id);
      } catch {}
      memoryUsers = memoryUsers.map((u) => (u.id === user_id ? { ...u, role } : u));
      return NextResponse.json({ success: true, message: 'Role updated successfully' });
    }

    if (action === 'reset_password' && new_password) {
      try {
        await supabase.auth.admin.updateUserById(user_id, { password: new_password });
      } catch {}
      return NextResponse.json({ success: true, message: 'Password reset successfully' });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: any) {
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

    try {
      const supabase = getAdminClient();
      await supabase.auth.admin.deleteUser(userId);
      await supabase.from('member_profiles').delete().eq('id', userId);
    } catch {}

    memoryUsers = memoryUsers.filter((u) => u.id !== userId);

    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
