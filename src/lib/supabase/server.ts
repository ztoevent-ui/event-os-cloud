// =============================================================================
// src/lib/supabase/server.ts
// Server-side Supabase client (Server Components, Server Actions, Route Handlers)
// =============================================================================
// Use this in:
//   - app/ Server Components (default)
//   - app/api/ Route Handlers
//   - Server Actions ("use server")
//
// Architecture: Uses @supabase/ssr createServerClient which reads/writes auth
// cookies. MUST be called per-request (not as a singleton) because each
// request has different cookie state (different user sessions).
//
// Connection Pooling: Uses Supavisor Transaction Mode (port 6543) via
// SUPABASE_DB_POOLER_URL. In serverless environments, each function invocation
// is a new process — Transaction Mode pooling means we don't need persistent
// connections; connections are returned to the pool after each transaction.
// =============================================================================

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for Server Components and Route Handlers.
 * Reads user session from cookies — the authenticated user's RLS policies apply.
 *
 * Usage in Server Component:
 *   const supabase = await createSupabaseServerClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *
 * Usage in Route Handler:
 *   export async function GET() {
 *     const supabase = await createSupabaseServerClient();
 *     const { data } = await supabase.from('zt_orders').select('*');
 *     return Response.json(data);
 *   }
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The setAll method is called from a Server Component.
            // Ignore if cookies can't be set (they'll be set by middleware).
          }
        },
      },
    }
  );
}

/**
 * Convenience: Get the currently authenticated user from the server.
 * Returns null if not authenticated.
 *
 * Usage:
 *   const user = await getAuthenticatedUser();
 *   if (!user) redirect('/auth/login');
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}
