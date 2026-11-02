import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { auditLog, isUuid, noStoreJson, readJsonObject, requireAdmin } from '@/lib/api-security';
import { isResetRequestExpired } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const body = await readJsonObject(req);
    if (!body) return noStoreJson({ error: 'Invalid request body' }, 400);
    const { action, reqId, request_id } = body as Record<string, unknown>;
    const id = typeof reqId === 'string' ? reqId : request_id;
    if ((action !== 'accept' && action !== 'reject') || typeof id !== 'string' || !isUuid(id)) {
      return noStoreJson({ error: 'Invalid request or action' }, 400);
    }

    const supabase = getAdminClient();
    const { data: request, error } = await supabase.from('password_reset_requests')
      .select('id, email, status, created_at, expires_at').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!request) return noStoreJson({ error: 'Reset request not found' }, 404);
    if (request.status !== 'pending') return noStoreJson({ error: 'Request has already been processed.' }, 409);

    if (action === 'accept') {
      if (isResetRequestExpired(request.expires_at, request.created_at)) {
        await supabase.from('password_reset_requests').update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', id).eq('status', 'pending');
        return noStoreJson({ error: 'Reset request expired.' }, 410);
      }
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
      if (!siteUrl) return noStoreJson({ error: 'Password reset email is not configured.' }, 503);
      const { error: mailError } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: new URL('/update-password', siteUrl).toString(),
      });
      if (mailError) return noStoreJson({ error: 'Failed to send recovery email.' }, 502);
    }

    const status = action === 'accept' ? 'approved' : 'rejected';
    const { data: changed, error: updateError } = await supabase.from('password_reset_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).eq('status', 'pending').select('id').maybeSingle();
    if (updateError) throw updateError;
    if (!changed) return noStoreJson({ error: 'Request was already processed.' }, 409);
    auditLog(action === 'accept' ? 'APPROVE_PASSWORD_RESET' : 'REJECT_PASSWORD_RESET', auth.user.id, `${action} request ${id}`);
    return noStoreJson({ success: true, request_id: id, action });
  } catch (error) {
    console.error('[Handle password request] failed:', error);
    return noStoreJson({ error: 'Failed to process request.' }, 500);
  }
}
