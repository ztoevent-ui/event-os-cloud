// =============================================================================
// app/api/ticketing/webhook/[provider]/route.ts
// POST — Unified server-to-server webhook receiver for all payment gateways
// =============================================================================
// Each gateway POSTs to: /api/ticketing/webhook/billplz
//                        /api/ticketing/webhook/senangpay
//                        /api/ticketing/webhook/stripe
//
// This route:
//   1. Reads the raw body (required for signature verification — parsed body breaks sigs)
//   2. Routes to the correct provider's handleWebhook() method
//   3. Calls confirm_order_payment RPC if payment succeeded
//   4. Always returns 200 to acknowledge receipt (even on logic errors)
//      — gateways retry on non-200 responses, causing duplicate processing
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { callConfirmOrderPayment } from '@/src/lib/supabase/admin';
import { PaymentFactory } from '@/src/services/payment/factory';
import type { PaymentProviderName } from '@/src/services/payment/types';

export const runtime = 'nodejs';

// CRITICAL: Disable Next.js body parsing — we need the raw body for HMAC verification
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ provider: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { provider: providerName } = await params;

  // ------------------------------------------------------------------
  // 1. Read raw body BEFORE any parsing
  //    (Required for all gateway signature verification)
  // ------------------------------------------------------------------
  const rawBody = await request.text();

  // Convert headers to plain object for provider
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });

  // ------------------------------------------------------------------
  // 2. Validate provider name
  // ------------------------------------------------------------------
  const validProviders: PaymentProviderName[] = ['billplz', 'senangpay', 'stripe', 'free'];
  if (!validProviders.includes(providerName as PaymentProviderName)) {
    console.warn(`[webhook] Unknown provider: ${providerName}`);
    // Still return 200 to avoid gateway retries on misconfigured URLs
    return NextResponse.json({ received: true, error: 'Unknown provider' }, { status: 200 });
  }

  // ------------------------------------------------------------------
  // 3. Route to provider's webhook handler
  // ------------------------------------------------------------------
  let webhookResult;
  try {
    const provider = PaymentFactory.getProvider(providerName as PaymentProviderName);
    webhookResult  = await provider.handleWebhook({ rawBody, headers });
  } catch (err) {
    console.error(`[webhook/${providerName}] Handler error:`, err);
    // Return 200 — we'll handle this manually, don't want gateway to retry indefinitely
    return NextResponse.json({ received: true, error: 'Handler error' }, { status: 200 });
  }

  // ------------------------------------------------------------------
  // 4. Process confirmed payments
  // ------------------------------------------------------------------
  if (webhookResult.processed && webhookResult.status === 'paid' && webhookResult.orderId) {
    try {
      const confirmResult = await callConfirmOrderPayment({
        p_order_id:          webhookResult.orderId,
        p_payment_provider:  providerName,
        p_payment_reference: webhookResult.providerPaymentId ?? '',
        p_payment_metadata:  webhookResult.rawEvent ?? {},
      });

      if (!confirmResult.success && confirmResult.code !== 'ALREADY_CONFIRMED') {
        // Log for manual review but still return 200
        console.error(`[webhook/${providerName}] Order confirmation failed:`, confirmResult);
      } else {
        console.log(`[webhook/${providerName}] Order ${webhookResult.orderId} confirmed. ` +
          `${confirmResult.attendee_count ?? 0} attendee record(s) created.`);
      }
    } catch (err) {
      console.error(`[webhook/${providerName}] DB confirmation error:`, err);
      // Return 200 to prevent gateway retry — this needs manual investigation
    }
  }

  // ------------------------------------------------------------------
  // 5. Always return 200 to acknowledge webhook receipt
  // ------------------------------------------------------------------
  return NextResponse.json({
    received:   true,
    processed:  webhookResult.processed,
    orderId:    webhookResult.orderId,
    status:     webhookResult.status,
  }, { status: 200 });
}
