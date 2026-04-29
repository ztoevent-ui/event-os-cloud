
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zihjzbweasaqqbwilshx.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppaGp6YndlYXNhcXFid2lsc2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4OTQ5MTYsImV4cCI6MjA4MTQ3MDkxNn0.ilHqOs75eUA6p2n-h1rgfulwNwq_hPQyptFg-kcjbv4';

    if (!supabaseUrl || !supabaseAnonKey) {
        return response;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // === ROUTE PROTECTION === //

    const path = request.nextUrl.pathname;

    // 1. Admin Routes (/admin/*) & Arena Admin
    if (path.startsWith('/admin') || (path.startsWith('/arena/') && path.endsWith('/admin'))) {
        if (!user) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }

        // Fetch User Role from Profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile) {
            return new NextResponse('403 Forbidden - No Profile Found', { status: 403 });
        }

        const role = profile.role?.toLowerCase() ?? '';

        // ── /admin/* routes: require 'admin' or 'SUPER_ADMIN' ──
        if (path.startsWith('/admin')) {
            if (role !== 'admin' && role !== 'super_admin') {
                // Not an admin — block with 403, do NOT redirect (prevents loops)
                return new NextResponse(
                    '403 Forbidden — Admin access required. Your role: ' + profile.role,
                    { status: 403 }
                );
            }
            return response; // Admin confirmed — allow through
        }

        // ── /arena/[eventId]/admin: require PROJECT_MANAGER or SUPER_ADMIN ──
        if (path.startsWith('/arena/')) {
            if (role !== 'project_manager' && role !== 'super_admin' && role !== 'admin') {
                return new NextResponse('403 Forbidden - Insufficient Permissions', { status: 403 });
            }
        }
    }

    // 2. Display Routes (/display/*): Public but separate logic (could be IP locked later, open for now)
    if (path.startsWith('/display')) {
        // Allow access without login
    }

    // 3. Public Routes (/public/*): Open to all
    if (path.startsWith('/public')) {
        // Allow access
    }

    // 4. Default: Redirect root authenticated users to /admin or home?
    // Current behavior: / stays public home.

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public assets
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
