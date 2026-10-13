import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { auditLog, isUuid, noStoreJson, readJsonObject, requireAdmin } from '@/lib/api-security';
import { guardAdminRemoval } from '@/lib/single-admin';

export const dynamic = 'force-dynamic';

/**
 * Deletes a member account.
 *
 * Enforces single-admin rule: cannot delete the sole admin.
 * Uses SQL handover for admin transfers.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const body = await readJsonObject(req);
    const fromQuery = new URL(req.url).searchParams.get('user_id');
    const targetUserId =
      (body?.targetUserId as string | undefined) ||
      (body?.user_id as string | undefined) ||
      fromQuery;

    if (!targetUserId || !isUuid(targetUserId)) {
      return noStoreJson({ error: 'Invalid targetUserId' }, 400);
    }

    // Self-deletion guard
    if (targetUserId === auth.user.id) {
      return noStoreJson({ error: 'Cannot delete your own account' }, 400);
    }

    // Single-admin guard for admin deletion
    const supabase = await (await import('@/lib/supabase/server')).createClient();
    const guard = await guardAdminRemoval(supabase, targetUserId);
    if (guard) {
      return noStoreJson({ error: guard.error.message, code: guard.error.code }, guard.error.status);
    }

    const adminClient = getAdminClient();

    const { error } = await adminClient.auth.admin.deleteUser(targetUserId);
    if (error) {
      console.error('[Delete-user] auth delete failed:', error.message);
      return noStoreJson({ error: error.message }, 400);
    }

    // member_profiles.id cascades from auth.users, so this is normally a no-op.
    // Done explicitly so the row is removed even if the cascade is missing.
    const { error: profErr } = await adminClient
      .from('member_profiles')
      .delete()
      .eq('id', targetUserId);
    if (profErr) {
      console.warn('[Delete-user] profile cleanup warning:', profErr.message);
    }

    auditLog('DELETE_USER', auth.user.id, `deleted ${targetUserId}`);
    return noStoreJson({ success: true });
  } catch (err: any) {
    console.error('[Delete-user error]:', err);
    return noStoreJson({ error: 'Failed to delete user' }, 500);
  }
}

/** Convenience alias so this route matches the consolidated DELETE surface. */
export async function DELETE(req: NextRequest) {
  return POST(req);
}