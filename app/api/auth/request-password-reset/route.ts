import { NextRequest } from 'next/server';
import { enforcePayloadSize } from '@/lib/security';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { handleResetRequest, resetRequestResponse } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';

/**
 * Password-reset request queue (old version's path, kept for compatibility).
 *
 * Shares its implementation with `/api/auth/reset-request` so both behave
 * identically and neither leaks whether an account exists. Expects the old
 * `new_password` field, though `proposedPassword` is also accepted.
 */
export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIP(req.headers);

    const rateLimit = await checkRateLimit(`pwd_reset_${clientIp}`, 'auth');
    if (!rateLimit.success) {
      return resetRequestResponse({
        status: 429,
        body: { error: 'Too many requests. Please wait a minute.' },
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    const rawBody = await enforcePayloadSize(req, 8 * 1024);
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return resetRequestResponse({ status: 400, body: { error: 'Invalid request body' } });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return resetRequestResponse({ status: 400, body: { error: 'Invalid request body' } });
    }

    const outcome = await handleResetRequest(
      body as Record<string, unknown>,
      clientIp
    );
    return resetRequestResponse(outcome);
  } catch (err: any) {
    console.error('[Request-password-reset error]:', err);
    return resetRequestResponse({ status: 500, body: { error: 'Failed to submit reset request.' } });
  }
}
