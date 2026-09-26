import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  auditLog,
  isUuid,
  noStoreJson,
  readJsonObject,
  requireAdmin,
} from '@/lib/api-security';

export const dynamic = 'force-dynamic';

/** Supabase Auth caps a page at this many users. */
const AUTH_PAGE_SIZE = 200;

/**
 * Approves or rejects a queued password-reset request.
 *
 * Old version behavior: Admin provides plaintext newPassword directly.
 * This matches the old version's `admin/handle-password-request` route.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;

  try {
    const body = await readJsonObject(req);
    if (!body) return noStoreJson({ error: 'Invalid request body' }, 400);

    const { action, reqId, request_id, newPassword, new_password } = body as Record<
      string,
      string | undefined
    >;
    const id = reqId ?? request_id;

    if (action !== 'accept' && action !== 'reject') {
      return noStoreJson({ error: 'Invalid action' }, 400);
    }
    if (!id || !isUuid(id)) {
      return noStoreJson({ error: 'Invalid reqId' }, 400);
    }

    const supabase = getAdminClient();

    if (action === 'reject') {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('[Handle-password-request] reject failed:', error.message);
        return noStoreJson({ error: 'Failed to reject request' }, 500);
      }

      auditLog('REJECT_PASSWORD_RESET', auth.user.id, `rejected request ${id}`);
      return noStoreJson({ success: true, request_id: id, action });
    }

    // --- accept ---
    const { data: resetReq, error: fetchErr } = await supabase
      .from('password_reset_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !resetReq) {
      return noStoreJson({ error: 'Reset request not found' }, 404);
    }

    if (resetReq.status !== 'pending') {
      return noStoreJson({ error: `Request is already ${resetReq.status}` }, 409);
    }

    // Admin provides the new password directly (old version behavior)
    const password = newPassword ?? new_password;

    if (!password || password.length < 8) {
      return noStoreJson(
        { error: 'New password must be at least 8 characters.' },
        400
      );
    }

    // Page through Auth users to find the target user
    let targetUser: { id: string } | null = null;
    for (let page = 1; page <= 10 && !targetUser; page++) {
      const { data: usersData, error: listErr } = await supabase.auth.admin.listUsers({
        page,
        perPage: AUTH_PAGE_SIZE,
      });
      if (listErr) {
        console.error('[Handle-password-request] listUsers failed:', listErr.message);
        return noStoreJson({ error: 'Failed to look up the account' }, 500);
      }

      targetUser =
        usersData?.users?.find(
          (u: any) => u.email?.toLowerCase() === String(resetReq.email).toLowerCase()
        ) ?? null;

      if (!usersData?.users?.length || usersData.users.length < AUTH_PAGE_SIZE) break;
    }

    if (!targetUser) {
      return noStoreJson({ error: 'No auth account matches that email' }, 404);
    }

    const { error: updateErr } = await supabase.auth.admin.updateUserById(targetUser.id, {
      password,
    });

    if (updateErr) {
      console.error('[Handle-password-request] password update failed:', updateErr.message);
      return noStoreJson({ error: 'Failed to update the account password' }, 500);
    }

    const { error: statusErr } = await supabase
      .from('password_reset_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (statusErr) {
      console.error('[Handle-password-request] status update failed:', statusErr.message);
    }

    auditLog('APPROVE_PASSWORD_RESET', auth.user.id, `approved request ${id}`);
    return noStoreJson({ success: true, request_id: id, action });
  } catch (err: any) {
    console.error('[Handle-password-request error]:', err);
    return noStoreJson({ error: 'Failed to process request' }, 500);
  }
}