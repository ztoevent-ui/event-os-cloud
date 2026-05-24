import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * ZTO Event OS — Next.js Proxy (proxy.ts)
 *
 * PRIMARY JOB 1: Refresh Supabase session cookies so tokens stay valid.
 * PRIMARY JOB 2: Waiting Room gate for high-demand ticketing routes (optional,
 *                activates only when UPSTASH_REDIS_REST_URL env var is set).
 *
 * IMPORTANT: All route-level auth & role checks are handled INSIDE each page
 * using the inline state-machine pattern ('checking' | 'no-session' | 'no-admin' | 'ready').
 * We do NOT do role-based redirects here because Edge Runtime cookie reads
 * can fail silently and cause infinite redirect loops.
 */

// =============================================================================
// WAITING ROOM CONFIGURATION
// Only active when UPSTASH_REDIS_REST_URL is present — bypassed in dev/staging
// =============================================================================

const QUEUE_MAX_SESSIONS  = parseInt(process.env.QUEUE_MAX_SESSIONS ?? '500', 10);
const QUEUE_TOKEN_TTL_SEC = 60 * 15; // 15 minutes

// Routes gated by the waiting room
const GATED_ROUTE_PATTERNS = [
  /^\/events\/[^/]+\/checkout/,
  /^\/api\/ticketing\/reserve/,
];

// Routes always excluded from gating
const EXCLUDED_PATTERNS = [
  /^\/queue/,
  /^\/auth/,
  /^\/_next/,
  /^\/favicon/,
  /^\/api\/ticketing\/webhook/,
  /^\/api\/ticketing\/queue-status/,
];

// =============================================================================
// UPSTASH REDIS HELPERS (pure REST — Edge-compatible, no SDK needed)
// =============================================================================

async function redisPipelineIncrExpire(key: string, ttlSec: number): Promise<number> {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return 0;

  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['INCR', key], ['EXPIRE', key, String(ttlSec)]]),
      cache: 'no-store',
    });
    const results = await res.json() as Array<{ result: number }>;
    return results[0]?.result ?? 0;
  } catch { return 0; }
}

async function redisDecr(key: string): Promise<void> {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return;
  try {
    await fetch(`${url}/decr/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch { /* silent */ }
}

// =============================================================================
// QUEUE TOKEN — HMAC-SHA256 signed, Edge-compatible (Web Crypto API)
// =============================================================================

async function signQueueToken(payload: string): Promise<string> {
  const secret  = process.env.QUEUE_SECRET ?? 'dev-queue-secret-change-in-production';
  const encoder = new TextEncoder();
  const key     = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sigBuf  = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hex     = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  const b64     = btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64}.${hex}`;
}

async function verifyQueueToken(token: string): Promise<boolean> {
  try {
    const [b64, sig] = token.split('.');
    if (!b64 || !sig) return false;
    const payload  = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    const expected = await signQueueToken(payload);
    const [, expSig] = expected.split('.');
    if (sig !== expSig) return false;
    // Check expiry embedded as third segment: "eventSlug:userId:issuedAtEpoch"
    const issuedAt = parseInt(payload.split(':')[2] ?? '0', 10);
    return Math.floor(Date.now() / 1000) - issuedAt <= QUEUE_TOKEN_TTL_SEC;
  } catch { return false; }
}

// =============================================================================
// MAIN PROXY FUNCTION
// =============================================================================

export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) return response;

  // ---------------------------------------------------------------------------
  // PART 1: Supabase session refresh (required by @supabase/ssr on every request)
  // ---------------------------------------------------------------------------
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();

  // ---------------------------------------------------------------------------
  // PART 2: Arena admin guard (existing behaviour — unchanged)
  // ---------------------------------------------------------------------------
  const path = request.nextUrl.pathname;
  if (path.startsWith('/arena/') && path.endsWith('/admin')) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.redirect(
        new URL(`/arena/login?returnTo=${encodeURIComponent(path)}`, request.url)
      );
    }
  }

  // ---------------------------------------------------------------------------
  // PART 3: Waiting Room gate (ticketing — only when Upstash env vars present)
  // ---------------------------------------------------------------------------
  const hasUpstash  = !!process.env.UPSTASH_REDIS_REST_URL;
  const isExcluded  = EXCLUDED_PATTERNS.some(p => p.test(path));
  const isGated     = GATED_ROUTE_PATTERNS.some(p => p.test(path));

  if (hasUpstash && isGated && !isExcluded) {
    const slugMatch   = path.match(/\/events\/([^/]+)\//);
    const eventSlug   = slugMatch?.[1] ?? 'global';
    const sessionKey  = `active_sessions:${eventSlug}`;

    // If the user already holds a valid queue token, let them through
    const existingToken = request.cookies.get('zt_queue_token')?.value;
    if (existingToken && await verifyQueueToken(existingToken)) {
      return response;
    }

    // Increment session counter atomically
    const currentSessions = await redisPipelineIncrExpire(sessionKey, QUEUE_TOKEN_TTL_SEC);

    if (currentSessions > QUEUE_MAX_SESSIONS) {
      // Over capacity — send to queue page and restore the counter increment
      await redisDecr(sessionKey);

      const queueUrl = new URL('/queue', request.url);
      queueUrl.searchParams.set('event', eventSlug);
      queueUrl.searchParams.set('return_to', path);
      queueUrl.searchParams.set('position', String(Math.max(0, currentSessions - QUEUE_MAX_SESSIONS)));
      return NextResponse.redirect(queueUrl);
    }

    // Admitted — issue a signed queue token cookie
    const { data: { user } } = await supabase.auth.getUser();
    const tokenPayload = `${eventSlug}:${user?.id ?? 'anon'}:${Math.floor(Date.now() / 1000)}`;
    const queueToken   = await signQueueToken(tokenPayload);

    response.cookies.set('zt_queue_token', queueToken, {
      httpOnly: true,
      secure:   true,
      sameSite: 'lax',
      maxAge:   QUEUE_TOKEN_TTL_SEC,
      path:     '/',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
