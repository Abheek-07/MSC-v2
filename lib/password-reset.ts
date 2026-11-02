import { NextResponse } from 'next/server';
import { isValidEmail } from '@/lib/security';
import { getAdminClient } from '@/lib/supabase/admin';
import { securityLog } from '@/lib/api-security';

export const RESET_TTL_HOURS = 24;
export const RESET_TTL_MS = RESET_TTL_HOURS * 60 * 60 * 1000;

export function isResetRequestExpired(expiresAt?: string | null, createdAt?: string | null): boolean {
  const deadline = expiresAt ? new Date(expiresAt).getTime() :
    createdAt ? new Date(createdAt).getTime() + RESET_TTL_MS : NaN;
  return !Number.isFinite(deadline) || deadline <= Date.now();
}

export interface ResetRequestOutcome {
  status: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
}

const SUCCESS: ResetRequestOutcome = {
  status: 200,
  body: { success: true, message: 'If an account matches that email, a reset request has been submitted.' },
  headers: { 'Cache-Control': 'no-store, max-age=0' },
};

export async function handleResetRequest(body: Record<string, unknown>, clientIp: string): Promise<ResetRequestOutcome> {
  const rawEmail = body.email;
  if (typeof rawEmail !== 'string' || !isValidEmail(rawEmail)) {
    return { status: 400, body: { error: 'Invalid email address' } };
  }
  const email = rawEmail.trim().toLowerCase();
  const supabase = getAdminClient();

  const { data: profile, error: profileError } = await supabase
    .from('member_profiles').select('id').eq('email', email).maybeSingle();
  if (profileError) {
    console.error('[Password reset] account lookup failed:', profileError.message);
    return { status: 503, body: { error: 'Password reset is temporarily unavailable.' } };
  }
  if (!profile) {
    securityLog('reset.unknown_account', 'Reset requested for an unregistered address', { ip: clientIp });
    return SUCCESS;
  }

  const { data: pending, error: pendingError } = await supabase
    .from('password_reset_requests').select('id').eq('email', email).eq('status', 'pending')
    .gt('expires_at', new Date().toISOString()).limit(1);
  if (pendingError) {
    console.error('[Password reset] pending lookup failed:', pendingError.message);
    return { status: 503, body: { error: 'Password reset is temporarily unavailable.' } };
  }
  if (pending?.length) {
    securityLog('reset.duplicate', 'Duplicate reset request suppressed', { ip: clientIp });
    return SUCCESS;
  }

  const { error: insertError } = await supabase.from('password_reset_requests').insert({
    email, new_password: null, status: 'pending',
    expires_at: new Date(Date.now() + RESET_TTL_MS).toISOString(),
  });
  if (insertError) {
    console.error('[Password reset] insert failed:', insertError.message);
    return { status: 503, body: { error: 'Password reset is temporarily unavailable.' } };
  }
  return SUCCESS;
}

export function resetRequestResponse(outcome: ResetRequestOutcome) {
  return NextResponse.json(outcome.body, {
    status: outcome.status,
    headers: { 'X-Content-Type-Options': 'nosniff', ...(outcome.headers || {}) },
  });
}
