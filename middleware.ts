import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''));

  // 1. CORS Preflight & Origin Verification for /api/ routes
  if (pathname.startsWith('/api/')) {
    // Check origin if present (cross-origin request)
    if (origin) {
      const isAllowed = allowedOrigins.includes(origin);
      if (!isAllowed) {
        return new NextResponse(JSON.stringify({ error: 'CORS origin not allowed' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json', Vary: 'Origin' },
        });
      }

      // Handle OPTIONS preflight
      if (request.method === 'OPTIONS') {
        const preflightHeaders = new Headers();
        preflightHeaders.set('Access-Control-Allow-Origin', origin);
        preflightHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        preflightHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        preflightHeaders.set('Access-Control-Allow-Credentials', 'true');
        preflightHeaders.set('Access-Control-Max-Age', '86400');
        preflightHeaders.set('Vary', 'Origin');
        return new NextResponse(null, { status: 204, headers: preflightHeaders });
      }
    }
  }

  // 2. Setup response and attach transport security headers
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(), payment=(self), usb=()'
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');

  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }

  // Content-Security-Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https:;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https: wss:;
    frame-src 'self' https://checkout.razorpay.com;
    media-src 'self' https: data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // 3. Supabase session and route gating
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Protected route check for /admin - Strict Cryptographic Gate
  if (pathname.startsWith('/admin')) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Re-verify role from member_profiles
    const { data: profile } = await supabase
      .from('member_profiles')
      .select('role, is_onboarded')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'core_member')) {
      // Access denied - not an authorized administrator
      const unauthorizedUrl = new URL('/login', request.url);
      unauthorizedUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(unauthorizedUrl);
    }
  }

  // Protected route check for /onboarding
  if (pathname.startsWith('/onboarding')) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - custom-events (static microsites)
     */
    '/((?!_next/static|_next/image|favicon.ico|custom-events).*)',
  ],
};
