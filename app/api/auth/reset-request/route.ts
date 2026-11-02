import { NextRequest } from 'next/server';
import { enforcePayloadSize } from '@/lib/security';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { handleResetRequest, resetRequestResponse } from '@/lib/password-reset';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIP(req.headers);
    const limit = await checkRateLimit(`pwd_reset_${clientIp}`, 'auth');
    if (!limit.success) {
      return resetRequestResponse({ status: 429, body: { error: 'Too many requests. Please wait a minute.' }, headers: { 'Cache-Control': 'no-store' } });
    }
    const raw = await enforcePayloadSize(req, 8 * 1024);
    let body: unknown;
    try { body = JSON.parse(raw); } catch {
      return resetRequestResponse({ status: 400, body: { error: 'Invalid request body' } });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return resetRequestResponse({ status: 400, body: { error: 'Invalid request body' } });
    }
    return resetRequestResponse(await handleResetRequest(body as Record<string, unknown>, clientIp));
  } catch (error) {
    console.error('[Reset request] failed:', error);
    return resetRequestResponse({ status: 500, body: { error: 'Failed to submit reset request.' } });
  }
}
