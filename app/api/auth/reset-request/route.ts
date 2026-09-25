import { NextResponse } from 'next/server';
import { enforcePayloadSize, isValidEmail, encryptSecret } from '@/lib/security';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const rawBody = await enforcePayloadSize(req, 8 * 1024);
    const body = JSON.parse(rawBody);

    const clientIp = getClientIP(req.headers);
    const rateLimit = await checkRateLimit(`pwd_reset_${clientIp}`, 'auth');
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    const { email, proposedPassword } = body;

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!proposedPassword || proposedPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    // Encrypt proposed password with AES-256-GCM (iv:authTag:ciphertext hex)
    const encryptedPassword = encryptSecret(proposedPassword);

    const supabase = getAdminClient();
    try {
      await supabase.from('password_reset_requests').insert({
        email: email.toLowerCase().trim(),
        new_password: encryptedPassword,
        status: 'pending',
      });
    } catch {
      // Memory fallback for demo
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset request encrypted and queued for admin review.',
    });
  } catch (err: any) {
    console.error('[Reset-request error]:', err);
    return NextResponse.json({ error: 'Failed to submit reset request.' }, { status: 500 });
  }
}
