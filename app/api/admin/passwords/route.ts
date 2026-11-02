import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';
import { isResetRequestExpired } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const limit = await checkRateLimit(auth.user.id, 'api');
    if (!limit.success) return noStoreJson({ error: 'Rate limit exceeded.' }, 429, { 'Retry-After': '60' });

    const supabase = getAdminClient();
    const { error: expireError } = await supabase.from('password_reset_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('status', 'pending').lte('expires_at', new Date().toISOString());
    if (expireError) throw expireError;

    const { data, error } = await supabase.from('password_reset_requests')
      .select('id, email, status, created_at, expires_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return noStoreJson({ success: true, requests: data || [] });
  } catch (error) {
    console.error('[Admin passwords] GET failed:', error);
    return noStoreJson({ error: 'Failed to fetch password requests.' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) return auth.error;
    const limit = await checkRateLimit(auth.user.id, 'api');
    if (!limit.success) return noStoreJson({ error: 'Rate limit exceeded.' }, 429, { 'Retry-After': '60' });

    const body = await req.json().catch(() => null);
    const id = body?.request_id;
    const action = body?.action;
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
      !['approve', 'reject'].includes(action)) return noStoreJson({ error: 'Invalid request or action' }, 400);

    const supabase = getAdminClient();
    const { data: request, error } = await supabase.from('password_reset_requests')
      .select('id, email, status, created_at, expires_at').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!request) return noStoreJson({ error: 'Reset request not found' }, 404);
    if (request.status !== 'pending') return noStoreJson({ error: 'Request has already been processed.' }, 409);
    if (isResetRequestExpired(request.expires_at, request.created_at)) {
      await supabase.from('password_reset_requests').update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', id).eq('status', 'pending');
      return noStoreJson({ error: 'Reset request expired. Ask the member to submit a new request.' }, 410);
    }

    if (action === 'approve') {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
      if (!siteUrl) return noStoreJson({ error: 'Set NEXT_PUBLIC_SITE_URL to enable recovery emails.' }, 503);
      const { error: mailError } = await supabase.auth.resetPasswordForEmail(request.email, {
        redirectTo: new URL('/update-password', siteUrl).toString(),
      });
      if (mailError) {
        console.error('[Admin passwords] recovery email failed:', mailError.message);
        return noStoreJson({ error: 'Failed to send recovery email.' }, 502);
      }
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    const { data: changed, error: updateError } = await supabase.from('password_reset_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).eq('status', 'pending').select('id').maybeSingle();
    if (updateError) throw updateError;
    if (!changed) return noStoreJson({ error: 'Request was processed by another administrator.' }, 409);
    return noStoreJson({ success: true, request_id: id, action });
  } catch (error) {
    console.error('[Admin passwords] POST failed:', error);
    return noStoreJson({ error: 'Failed to process password request.' }, 500);
  }
}
