import { NextResponse } from 'next/server';
import { decryptSecret } from '@/lib/security';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const { request_id, action } = await req.json();

    if (!request_id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request or action' }, { status: 400 });
    }

    const supabase = getAdminClient();

    if (action === 'approve') {
      try {
        const { data: resetReq } = await supabase
          .from('password_reset_requests')
          .select('*')
          .eq('id', request_id)
          .single();

        if (resetReq && resetReq.new_password) {
          // Decrypt ciphertext using DB_ENCRYPTION_KEY
          const decryptedPassword = decryptSecret(resetReq.new_password);

          // Find user by email and update password
          const { data: usersData } = await supabase.auth.admin.listUsers();
          const targetUser = usersData?.users.find(
            (u: any) => u.email?.toLowerCase() === resetReq.email.toLowerCase()
          );

          if (targetUser) {
            await supabase.auth.admin.updateUserById(targetUser.id, {
              password: decryptedPassword,
            });
          }
        }

        await supabase
          .from('password_reset_requests')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', request_id);
      } catch (dbErr) {
        console.warn('[Admin passwords approve DB]:', dbErr);
      }
    } else {
      try {
        await supabase
          .from('password_reset_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('id', request_id);
      } catch {
        // Fallback
      }
    }

    return NextResponse.json({ success: true, request_id, action });
  } catch (err: any) {
    console.error('[Admin passwords route error]:', err);
    return NextResponse.json({ error: 'Failed to process password request' }, { status: 500 });
  }
}
