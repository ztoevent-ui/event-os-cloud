// =============================================================================
// src/lib/supabase/client.ts
// Browser-side Supabase client (Client Components)
// =============================================================================
// Use this in:
//   - "use client" components
//   - Client-side hooks
//   - Browser event handlers
//
// Architecture: Uses @supabase/ssr createBrowserClient which automatically
// manages auth cookies for SSR hydration consistency.
// =============================================================================

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in Client Components.
 * Uses the anon key — all access is governed by RLS policies.
 *
 * Usage:
 *   const supabase = createSupabaseBrowserClient();
 *   const { data } = await supabase.from('zt_events').select('*');
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton pattern for components that call this frequently
// (avoids creating multiple GoTrueClient instances)
let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient();
  }
  return browserClient;
}
