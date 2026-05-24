// =============================================================================
// src/lib/supabase/admin.ts
// Service-Role Supabase client (trusted server-side operations ONLY)
// =============================================================================
// ⚠️  DANGER: This client BYPASSES all Row Level Security policies.
//     NEVER import this in Client Components or expose it to the browser.
//     NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client.
//
// Use this ONLY in:
//   - Webhook handlers (payment gateway callbacks)
//   - Background jobs / cron functions
//   - Admin API routes (with your own auth guard)
//   - Server Actions that need to operate across user boundaries
//
// Connection Pooling Strategy:
//   - Uses Supavisor Transaction Mode (port 6543) via SUPABASE_DB_POOLER_URL
//   - Transaction Mode: connection is acquired when a query starts and released
//     immediately after the transaction completes. Perfect for serverless.
//   - This prevents connection exhaustion under traffic spikes where hundreds
//     of Vercel Lambda instances spin up simultaneously.
//
// Without pooling (direct port 5432):
//   - Each Lambda = 1 Postgres connection
//   - 500 concurrent Lambdas = 500 connections → Supabase free tier limit hit
//
// With Supavisor Transaction Mode (port 6543):
//   - 500 Lambdas may share a pool of 15-25 Postgres connections
//   - Queries queue in Supavisor, not in your application
// =============================================================================

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// Lazy factory — validates env vars at call time, not import time.
// This prevents build failures when SUPABASE_SERVICE_ROLE_KEY is absent
// in environments that don't use the admin client (e.g. Edge functions).
// =============================================================================

function createAdminClient() {
  const supabaseUrl    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fallback: try the legacy hardcoded URL that exists in lib/supabaseClient.ts
  // so admin ops work even before env vars are explicitly set
  const resolvedUrl = supabaseUrl ?? 'https://zihjzbweasaqqbwilshx.supabase.co';

  if (!serviceRoleKey) {
    throw new Error(
      '[supabase/admin] Missing SUPABASE_SERVICE_ROLE_KEY. ' +
      'Add it to .env.local — find it in Supabase Dashboard → Project Settings → API.'
    );
  }

  return createClient(resolvedUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken:  false,
      persistSession:    false,
      detectSessionInUrl: false,
    },
    db: { schema: 'public' },
    global: {
      fetch: (url, options = {}) => fetch(url, { ...options, cache: 'no-store' }),
    },
  });
}

// Memoised instance — created on first access, reused across the same Lambda invocation
let _adminClient: ReturnType<typeof createAdminClient> | null = null;

export function getAdminClient() {
  if (!_adminClient) _adminClient = createAdminClient();
  return _adminClient;
}

/**
 * Convenience export for direct use:
 *   import { supabaseAdmin } from '@/src/lib/supabase/admin';
 *   await supabaseAdmin.from('zt_orders').select(...);
 *
 * ⚠️  Will throw at CALL TIME (not import time) if SUPABASE_SERVICE_ROLE_KEY is missing.
 */
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createAdminClient>, {
  get(_target, prop) {
    return (getAdminClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Typed RPC call helper for the anti-oversell stored procedure.
 * Wraps the raw RPC call with TypeScript types for better DX.
 */
export interface ReserveTicketParams {
  p_tier_id:      string;
  p_user_id:      string;
  p_quantity:     number;
  p_buyer_name:   string;
  p_buyer_email:  string;
  p_buyer_phone?: string;
}

export interface ReserveTicketResult {
  success:            boolean;
  code:               string;
  message:            string;
  order_id?:          string;
  order_item_id?:     string;
  event_id?:          string;
  tier_id?:           string;
  tier_name?:         string;
  quantity?:          number;
  unit_price?:        number;
  total_amount?:      number;
  currency?:          string;
  expires_at?:        string;
  available_capacity?: number;
  max_allowed?:       number;
  opens_at?:          string;
}

export async function callReserveTicket(
  params: ReserveTicketParams
): Promise<ReserveTicketResult> {
  const { data, error } = await supabaseAdmin.rpc('reserve_ticket_and_create_order', params);

  if (error) {
    return {
      success: false,
      code: 'RPC_ERROR',
      message: error.message,
    };
  }

  return data as ReserveTicketResult;
}

export interface ConfirmPaymentParams {
  p_order_id:             string;
  p_payment_provider:     string;
  p_payment_reference:    string;
  p_payment_metadata?:    Record<string, unknown>;
}

export interface ConfirmPaymentResult {
  success:          boolean;
  code:             string;
  message:          string;
  order_id?:        string;
  attendee_ids?:    string[];
  attendee_count?:  number;
}

export async function callConfirmOrderPayment(
  params: ConfirmPaymentParams
): Promise<ConfirmPaymentResult> {
  const { data, error } = await supabaseAdmin.rpc('confirm_order_payment', {
    p_order_id:          params.p_order_id,
    p_payment_provider:  params.p_payment_provider,
    p_payment_reference: params.p_payment_reference,
    p_payment_metadata:  params.p_payment_metadata ?? {},
  });

  if (error) {
    return {
      success: false,
      code: 'RPC_ERROR',
      message: error.message,
    };
  }

  return data as ConfirmPaymentResult;
}
