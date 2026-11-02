import crypto from 'node:crypto';

/**
 * A guest registration claim is an HttpOnly, same-site capability. It binds
 * checkout and idempotent retries to the browser that created a registration
 * without exposing a reusable bearer value in JSON or URLs.
 */
export const REGISTRATION_CLAIM_COOKIE = 'msc_registration_claim';

export function createRegistrationClaim(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashRegistrationClaim(claim: string): string {
  return crypto.createHash('sha256').update(claim, 'utf8').digest('hex');
}

export function getRegistrationClaim(request: Request): string | null {
  const raw = request.headers.get('cookie') || '';
  const item = raw.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${REGISTRATION_CLAIM_COOKIE}=`));
  if (!item) return null;
  const value = item.slice(REGISTRATION_CLAIM_COOKIE.length + 1);
  return /^[A-Za-z0-9_-]{40,}$/.test(value) ? value : null;
}

export const registrationClaimCookie = (claim: string) => ({
  name: REGISTRATION_CLAIM_COOKIE,
  value: claim,
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24,
});

/** Deterministic JSON avoids property-order changes invalidating legitimate retries. */
export function registrationFingerprint(value: unknown): string {
  const canonicalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(canonicalize);
    if (input && typeof input === 'object') {
      return Object.fromEntries(Object.entries(input as Record<string, unknown>)
        .filter(([key]) => key !== 'hash_payload')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonicalize(child)]));
    }
    return input;
  };
  return crypto.createHash('sha256').update(JSON.stringify(canonicalize(value)), 'utf8').digest('hex');
}
