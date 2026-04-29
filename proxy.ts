import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * ZTO Event OS — Next.js Middleware (proxy.ts)
 *
 * PRIMARY JOB: Refresh Supabase session cookies so tokens stay valid.
 *
 * IMPORTANT: All route-level auth & role checks are handled INSIDE each page
 * using the inline state-machine pattern ('checking' | 'no-session' | 'no-admin' | 'ready').
 * We do NOT do role-based redirects here because Edge Runtime cookie reads
 * can fail silently and cause infinite redirect loops.
 */

export default async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: { headers: request.headers },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !supabaseAnonKey) return response;

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request: { headers: request.headers } });
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
                );
            },
        },
    });

    // Refresh the session token (this is the ONLY job of this middleware)
    await supabase.auth.getUser();

    // ── Only guard: Arena operator pages require a session ──────────────────
    // All other auth/role checks are in-page.
    const path = request.nextUrl.pathname;
    if (path.startsWith('/arena/') && path.endsWith('/admin')) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.redirect(
                new URL(`/arena/login?returnTo=${encodeURIComponent(path)}`, request.url)
            );
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
