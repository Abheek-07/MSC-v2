import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';
import { guardRoleChange, guardAdminRemoval } from '@/lib/single-admin';

export const dynamic = 'force-dynamic';

const VALID_ROLES = ['admin', 'member'] as const;

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const rateLimit = await checkRateLimit(auth.user.id, 'api');
    if (!rateLimit.success) {
      return noStoreJson(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        429,
        { 'Retry-After': '60' }
      );
    }

    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('member_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return noStoreJson({ success: true, users: data || [] });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    return noStoreJson({ error: err.message, users: [] }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const rateLimit = await checkRateLimit(auth.user.id, 'api');
    if (!rateLimit.success) {
      return noStoreJson(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        429,
        { 'Retry-After': '60' }
      );
    }

    const { email, password, full_name, role, department, year } = await req.json();

    if (!email || !password || password.length < 8) {
      return noStoreJson(
        { error: 'Valid email and password (minimum 8 characters) required' },
        400
      );
    }

    const assignedRole = role === 'admin' ? 'admin' : 'member';
    const supabase = getAdminClient();

    // Single-admin guard for admin role assignment
    if (assignedRole === 'admin') {
      const client = await createClient();
      const guard = await guardRoleChange(client, 'admin', 'new');
      if (guard) {
        return noStoreJson(
          { error: guard.error.message, code: guard.error.code },
          guard.error.status
        );
      }
    }

    // Provision user via Supabase Auth Admin API
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: assignedRole },
    });

    if (authError) {
      console.error('Supabase Auth user creation error:', JSON.stringify(authError, null, 2));
      return noStoreJson({ 
        error: authError.message || 'Auth creation failed', 
        code: authError.code,
        status: authError.status,
        details: authError.details,
        hint: authError.hint
      }, 400);
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
        return noStoreJson(
          { error: profError.message || 'Profile creation failed', code: profError.code, details: profError.details, hint: profError.hint, user: authUser.user },
          500
        );
      }

      return noStoreJson({ success: true, user: profile });
    }

    return noStoreJson({ error: 'Failed to create user' }, 500);
  } catch (err: any) {
    console.error('Admin provision user error:', err);
    return noStoreJson({ error: err.message || 'Failed to create user', code: err.code }, 500);
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const rateLimit = await checkRateLimit(auth.user.id, 'api');
    if (!rateLimit.success) {
      return noStoreJson(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        429,
        { 'Retry-After': '60' }
      );
    }

    const { user_id, action, role, new_password } = await req.json();

    if (!user_id) {
      return noStoreJson({ error: 'User ID is required' }, 400);
    }

    const supabase = getAdminClient();
    const client = await createClient();

    if (action === 'update_role' && role) {
      if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
        return noStoreJson({ error: 'Invalid role. Must be admin or member' }, 400);
      }

      // Single-admin guards
      const guard = await guardRoleChange(client, role, user_id);
      if (guard) {
        return noStoreJson(
          { error: guard.error.message, code: guard.error.code },
          guard.error.status
        );
      }

      const { error } = await supabase
        .from('member_profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', user_id);

      if (error) throw error;
      return noStoreJson({ success: true, message: 'Role updated successfully' });
    }

    if (action === 'reset_password' && new_password) {
      const { error } = await supabase.auth.admin.updateUserById(user_id, { password: new_password });
      if (error) throw error;
      return noStoreJson({ success: true, message: 'Password reset successfully' });
    }

    return noStoreJson({ error: 'Invalid action specified' }, 400);
  } catch (err: any) {
    console.error('Admin user update error:', err);
    return noStoreJson({ error: err.message }, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;

    const rateLimit = await checkRateLimit(auth.user.id, 'api');
    if (!rateLimit.success) {
      return noStoreJson(
        { error: 'Rate limit exceeded. Please wait a minute before trying again.' },
        429,
        { 'Retry-After': '60' }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return noStoreJson({ error: 'User ID is required' }, 400);
    }

    if (userId === auth.user.id) {
      return noStoreJson(
        { error: 'Forbidden: You cannot delete your own administrative account' },
        400
      );
    }

    // Single-admin guard for admin deletion
    const client = await createClient();
    const guard = await guardAdminRemoval(client, userId);
    if (guard) {
      return noStoreJson(
        { error: guard.error.message, code: guard.error.code },
        guard.error.status
      );
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

    return noStoreJson({ success: true, message: 'Account deleted' });
  } catch (err: any) {
    console.error('Admin user delete error:', err);
    return noStoreJson({ error: err.message }, 500);
  }
}