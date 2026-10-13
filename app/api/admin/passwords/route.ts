import { decryptSecret } from '@/lib/security';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, noStoreJson } from '@/lib/api-security';
import { checkRateLimit } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

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
      .from('password_reset_requests')
      .select('id, email, status, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return noStoreJson({ success: true, requests: data || [] });
  } catch (err: any) {
    console.error('Error fetching password requests:', err);
    return noStoreJson({ error: err.message }, 500);
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

    const { request_id, action } = await req.json();

    if (!request_id || !['approve', 'reject'].includes(action)) {
      return noStoreJson({ error: 'Invalid request or action' }, 400);
    }

    const supabase = getAdminClient();

    if (action === 'approve') {
      const { data: resetReq, error: fetchErr } = await supabase
        .from('password_reset_requests')
        .select('*')
        .eq('id', request_id)
        .single();

      if (fetchErr || !resetReq) {
        return noStoreJson({ error: 'Reset request not found' }, 404);
      }

      if (resetReq.new_password) {
        // Decrypt ciphertext using DB_ENCRYPTION_KEY
        const decryptedPassword = decryptSecret(resetReq.new_password);

        // Find user by email and update password in Supabase Auth
        const { data: usersData } = await supabase.auth.admin.listUsers();
        const targetUser = usersData?.users.find(
          (u: any) => u.email?.toLowerCase() === resetReq.email.toLowerCase()
        );

        if (targetUser) {
          const { error: pwdErr } = await supabase.auth.admin.updateUserById(targetUser.id, {
            password: decryptedPassword,
          });
          if (pwdErr) {
            console.error('Failed to update Supabase Auth user password:', pwdErr);
            return noStoreJson({ error: 'Failed to update auth password: ' + pwdErr.message }, 500);
          }
        }
      }

      const { error: updateErr } = await supabase
        .from('password_reset_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', request_id);

      if (updateErr) throw updateErr;
    } else {
      const { error: updateErr } = await supabase
        .from('password_reset_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', request_id);

      if (updateErr) throw updateErr;
    }

    return noStoreJson({ success: true, request_id, action });
  } catch (err: any) {
    console.error('[Admin passwords route error]:', err);
    return noStoreJson({ error: err.message || 'Failed to process password request' }, 500);
  }
}