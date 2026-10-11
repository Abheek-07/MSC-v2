import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { auditLog, isUuid, noStoreJson, readJsonObject, requireAdmin } from '@/lib/api-security';
import { guardRoleChange, SINGLE_ADMIN_ERROR } from '@/lib/single-admin';

export const dynamic = 'force-dynamic';

const VALID_ROLES = ['admin', 'member'] as const;

/**
 * Changes a member's role.
 *
 * Enforces single-admin rule: cannot promote to admin if another admin exists.
 * Cannot demote the sole admin.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const body = await readJsonObject(req);
    if (!body) return noStoreJson({ error: 'Invalid request body' }, 400);

    const targetUserId = (body.targetUserId ?? body.user_id) as string | undefined;
    const newRole = (body.newRole ?? body.role) as string | undefined;

    if (!targetUserId || !isUuid(targetUserId)) {
      return noStoreJson({ error: 'Invalid targetUserId' }, 400);
    }
    if (!newRole || !VALID_ROLES.includes(newRole as (typeof VALID_ROLES)[number])) {
      return noStoreJson(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` },
        400
      );
    }

    // Self-role-change guard
    if (targetUserId === auth.user.id) {
      return noStoreJson({ error: 'Cannot change your own role' }, 400);
    }

    // Single-admin guards
    const supabase = await (await import('@/lib/supabase/server')).createClient();
    const guard = await guardRoleChange(supabase, newRole, targetUserId);
    if (guard) {
      return noStoreJson({ error: guard.error.message, code: guard.error.code }, guard.error.status);
    }

    const adminClient = getAdminClient();
    const { error } = await adminClient
      .from('member_profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', targetUserId);

    if (error) {
      console.error('[Elevate-role] update failed:', error.message);
      return noStoreJson({ error: 'Failed to update role' }, 400);
    }

    auditLog('UPDATE_ROLE', auth.user.id, `set ${targetUserId} to ${newRole}`);
    return noStoreJson({ success: true, user_id: targetUserId, role: newRole });
  } catch (err: any) {
    console.error('[Elevate-role error]:', err);
    return noStoreJson({ error: 'Failed to update member role' }, 500);
  }
}