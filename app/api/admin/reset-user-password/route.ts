import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { auditLog, isUuid, noStoreJson, readJsonObject, requireAdmin } from '@/lib/api-security';

export const dynamic = 'force-dynamic';

/**
 * Admin-initiated password reset for a specific account.
 *
 * Ported from the older project's `admin/reset-user-password`. Distinct from
 * the queued `/api/admin/passwords` approval flow: this sets a password
 * immediately, without a user-submitted request.
 *
 * Accepts both the old field names (`targetUserId` / `newPassword`) and the
 * consolidated route's (`user_id` / `new_password`).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const body = await readJsonObject(req);
    if (!body) return noStoreJson({ error: 'Invalid request body' }, 400);

    const targetUserId = (body.targetUserId ?? body.user_id) as string | undefined;
    const newPassword = (body.newPassword ?? body.new_password) as string | undefined;

    if (!targetUserId || !isUuid(targetUserId)) {
      return noStoreJson({ error: 'Invalid targetUserId' }, 400);
    }
    if (!newPassword || newPassword.length < 8) {
      return noStoreJson({ error: 'Password must be at least 8 characters' }, 400);
    }

    // Self-reset guard, ported from the old version. An admin changing their
    // own password should use the normal change-password flow.
    if (targetUserId === auth.user.id) {
      return noStoreJson(
        { error: 'Use the standard password change flow for your own account' },
        400
      );
    }

    const supabase = getAdminClient();
    const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (error) {
      console.error('[Reset-user-password] update failed:', error.message);
      return noStoreJson({ error: 'Failed to reset password' }, 400);
    }

    auditLog('RESET_PASSWORD', auth.user.id, `reset password for ${targetUserId}`);
    return noStoreJson({ success: true });
  } catch (err: any) {
    console.error('[Reset-user-password error]:', err);
    return noStoreJson({ error: 'Failed to reset password' }, 500);
  }
}
