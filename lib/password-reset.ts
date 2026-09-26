import { NextResponse } from 'next/server';
import { isValidEmail, encryptSecret } from '@/lib/security';
import { getAdminClient } from '@/lib/supabase/admin';
import { securityLog } from '@/lib/api-security';

const MIN_PASSWORD_LENGTH = 8;

/**
 * How long a queued reset request stays approvable.
 *
 * The row stores an AES-256-GCM ciphertext of the proposed password, so a
 * request left pending indefinitely keeps that ciphertext decryptable. Expiring
 * it bounds that window. Override with PASSWORD_RESET_TTL_HOURS.
 *
 * Shared by `/api/auth/*` (submit) and both admin approval routes so they can
 * never disagree about what counts as expired.
 */
export const RESET_TTL_HOURS = Number(process.env.PASSWORD_RESET_TTL_HOURS || 24);
export const RESET_TTL_MS = RESET_TTL_HOURS * 60 * 60 * 1000;

/** True when a pending request is too old to approve. */
export function isResetRequestExpired(createdAt: string | null | undefined): boolean {
  if (!createdAt) return true;
  const age = Date.now() - new Date(createdAt).getTime();
  return !Number.isFinite(age) || age > RESET_TTL_MS;
}

export interface ResetRequestOutcome {
  status: number;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
}

/**
 * The single success shape. Deliberately verbose so it is indistinguishable
 * between the "queued" and "unknown address" paths.
 */
const SUCCESS = {
  status: 200,
  body: {
    success: true,
    message: 'Password reset request submitted securely for administrator approval.',
  },
  headers: { 'Cache-Control': 'no-store, max-age=0' },
} satisfies ResetRequestOutcome;

/**
 * Shared handler for password-reset requests.
 *
 * Ported from the older project's `request-password-reset` route, which had one
 * property this project lacked: it returned an identical success response
 * whether or not the account exists. The previous implementation wrote a
 * pending row for any well-formed address, so the endpoint doubled as an
 * account-enumeration oracle.
 *
 * Two hardening changes on top of the old version, both of which this project
 * already had elsewhere:
 *   - duplicate suppression (one pending request per target)
 *   - `no-store`, since the response concerns a credential reset
 *
 * Exported so both `/api/auth/reset-request` (used by the current login page)
 * and `/api/auth/request-password-reset` (the old version's path) behave
 * identically.
 *
 * @param body Request body. Accepts `proposedPassword` (current) or
 *             `new_password` (old version's field name) so the existing form
 *             keeps working without a client change.
 */
export async function handleResetRequest(body: Record<string, unknown>, clientIp: string) {
  // Accept both field names across the two projects.
  const rawEmail = body.email;
  const proposedPassword = (body.proposedPassword ?? body.new_password) as string | undefined;

  if (typeof rawEmail !== 'string' || !isValidEmail(rawEmail)) {
    return {
      status: 400,
      body: { error: 'Invalid email address' },
    } satisfies ResetRequestOutcome;
  }

  if (!proposedPassword || proposedPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      status: 400,
      body: { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` },
    } satisfies ResetRequestOutcome;
  }

  const targetEmail = rawEmail.toLowerCase().trim();

  // Encryption happens before the existence check so that both branches cost
  // roughly the same, and a failure surfaces identically either way.
  let encryptedPassword: string;
  try {
    encryptedPassword = encryptSecret(proposedPassword);
  } catch {
    console.error('[Password reset] encryption key unavailable');
    return {
      status: 500,
      body: { error: 'Password reset is temporarily unavailable. Please contact an administrator.' },
    } satisfies ResetRequestOutcome;
  }

  const supabase = getAdminClient();

  // Enumeration guard: the response below is byte-identical regardless of
  // whether this address has an account.
  const { data: profile } = await supabase
    .from('member_profiles')
    .select('id')
    .eq('email', targetEmail)
    .maybeSingle();

  if (!profile) {
    securityLog('reset.unknown_account', 'Reset requested for an unregistered address', {
      ip: clientIp,
    });
    return SUCCESS;
  }

  try {
    const { data: existing } = await supabase
      .from('password_reset_requests')
      .select('id')
      .eq('email', targetEmail)
      .eq('status', 'pending')
      .limit(1);

    if (!existing || existing.length === 0) {
      await supabase.from('password_reset_requests').insert({
        email: targetEmail,
        new_password: encryptedPassword,
        status: 'pending',
      });
    } else {
      // A single target accumulating reset requests is a targeting signal.
      securityLog('reset.duplicate', 'Duplicate reset request suppressed', { ip: clientIp });
    }
  } catch (err) {
    console.error('[Password reset] insert failed:', err);
  }

  return SUCCESS;
}

export function resetRequestResponse(outcome: ResetRequestOutcome) {
  return NextResponse.json(outcome.body, {
    status: outcome.status,
    headers: { 'X-Content-Type-Options': 'nosniff', ...(outcome.headers || {}) },
  });
}
