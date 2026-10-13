import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { isValidEmail } from '@/lib/security';
import {
  auditLog,
  noStoreJson,
  readJsonObject,
  requireAdmin,
} from '@/lib/api-security';
import { guardRoleChange } from '@/lib/single-admin';

export const dynamic = 'force-dynamic';

const VALID_ROLES = ['admin', 'member'] as const;

/**
 * Provisions a member account.
 *
 * Uses the shared `requireAdmin()` guard so the check cannot drift.
 * Enforces single-admin rule: cannot create an admin if another admin exists.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const body = await readJsonObject(req);
    if (!body) return noStoreJson({ error: 'Invalid request body' }, 400);

    const { email, password, role, full_name, department, year } = body as {
      email?: string;
      password?: string;
      role?: string;
      full_name?: string;
      department?: string;
      year?: string;
    };

    if (!email || !isValidEmail(email)) {
      return noStoreJson({ error: 'Valid email is required' }, 400);
    }
    if (!password || password.length < 8) {
      return noStoreJson({ error: 'Password must be at least 8 characters' }, 400);
    }
    if (role && !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
      return noStoreJson({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` }, 400);
    }

    const assignedRole = VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])
      ? role!
      : 'member';

    // Single-admin guard for admin role assignment
    if (assignedRole === 'admin') {
      const supabase = await (await import('@/lib/supabase/server')).createClient();
      const guard = await guardRoleChange(supabase, 'admin', 'new'); // target doesn't exist yet
      if (guard) {
        return noStoreJson({ error: guard.error.message, code: guard.error.code }, guard.error.status);
      }
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role: assignedRole },
    });

    if (error) {
      console.error('[Create-user] auth error:', JSON.stringify(error, null, 2));
      return noStoreJson({ error: error.message || 'Auth creation failed', code: error.code, status: error.status, details: error.details, hint: error.hint }, 400);
    }

    if (data?.user) {
      const { error: profErr } = await supabase.from('member_profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        full_name: full_name || email.split('@')[0],
        role: assignedRole,
        department: department || 'CSE',
        year_of_study: year || '3rd Year',
        is_onboarded: true,
        updated_at: new Date().toISOString(),
      });

      if (profErr) {
        console.error('[Create-user] profile upsert failed:', profErr);
        // Return the actual database error
        return noStoreJson(
          { error: profErr.message || 'Profile upsert failed', code: profErr.code, details: profErr.details, hint: profErr.hint, user: data.user },
          500
        );
      }
    }

    auditLog('CREATE_USER', auth.user.id, `created ${email} as ${assignedRole}`);
    return noStoreJson({ success: true, user: data?.user });
  } catch (err: any) {
    console.error('[Create-user error]:', err);
    return noStoreJson({ error: err.message || 'Failed to create user', code: err.code }, 500);
  }
}