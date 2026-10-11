'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIP } from '@/lib/ratelimit';
import { isValidEmail } from '@/lib/security';
import { securityLog } from '@/lib/api-security';

export interface AuthActionState {
  error?: string;
  message?: string;
}

const MIN_PASSWORD_LENGTH = 8;

/**
 * Reads the client IP for rate-limit keying.
 *
 * Server Actions have no `Request` object, so the headers are read from the
 * incoming action request instead.
 */
async function actionClientIp(): Promise<string> {
  try {
    const h = await headers();
    return getClientIP(h as unknown as Headers);
  } catch {
    return '127.0.0.1';
  }
}

/**
 * Resolves where a freshly authenticated user belongs.
 *
 * Preserved from the existing client-side flow (admin -> /admin, incomplete
 * profile -> /onboarding). The old version redirected everything to /events,
 * which would strand admins and new members in the wrong place.
 */
async function resolveLanding(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return '/';

  const { data: profile } = await supabase
    .from('member_profiles')
    .select('role, is_onboarded')
    .eq('id', session.user.id)
    .single();

  if (profile?.role === 'admin') return '/admin';
  if (profile && !profile.is_onboarded) return '/onboarding';
  return '/events';
}

/**
 * Signs a user in, server-side.
 *
 * This replaces the previous client-side `supabase.auth.signInWithPassword`
 * call, which meant credentials were handed to the browser and, because it
 * never passed through `/api/*`, bypassed every rate limit in the app.
 */
export async function login(formData: FormData): Promise<AuthActionState> {
  const email = String(formData.get('email') || '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') || '');
  const ip = await actionClientIp();

  // Brute-force protection: throttle per IP and per account.
  const [byIp, byAccount] = await Promise.all([
    checkRateLimit(`login_ip:${ip}`, 'auth'),
    checkRateLimit(`login_acct:${email || 'unknown'}`, 'auth'),
  ]);

  if (!byIp.success || !byAccount.success) {
    securityLog('auth.denied', 'Login throttled by rate limiter', {
      ip,
      status: 429,
    });
    return { error: 'Too many sign-in attempts. Please wait a minute and try again.' };
  }

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  if (!isValidEmail(email)) {
    // Deliberately vague: do not confirm which addresses are registered.
    return { error: 'Unable to sign in with those details.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Same message for unknown-account and wrong-password, so the form is not
    // an account-existence oracle.
    securityLog('auth.missing', 'Sign-in rejected', { ip, status: 401 });
    return { error: 'Unable to sign in with those details.' };
  }

  const destination = await resolveLanding(supabase);
  redirect(destination);
}