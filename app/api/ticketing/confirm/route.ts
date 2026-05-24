// =============================================================================
// app/api/ticketing/confirm/route.ts
// GET — Handle payment gateway redirect back (browser callback)
// =============================================================================
// Called when the user's browser is redirected back from the payment gateway.
// This is a browser-visible redirect, NOT a server-to-server webhook.
// The authoritative payment confirmation comes via the webhook route.
//
// Flow:
//   GET /api/ticketing/confirm?order_id=xxx&[gateway_params...]
//   → Verify callback signature
//   → If valid, redirect to /orders/[id]/success
//   → If invalid, redirect to /orders/[id]/failed
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/src/lib/supabase/admin';
import { PaymentFactory } from '@/src/services/payment/factory';
import type { PaymentProviderName } from '@/src/services/payment/types';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ztoevent.com';

  const orderId = searchParams.get('order_id');
  if (!orderId) {
    return NextResponse.redirect(`${siteUrl}/events?error=missing_order`);
  }

  try {
    // Fetch order to determine which provider was used
    const { data: order, error } = await supabaseAdmin
      .from('zt_orders')
      .select('id, status, payment_provider, event_id')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.redirect(`${siteUrl}/events?error=order_not_found`);
    }

    // If already paid (webhook fired first), go straight to success
    if (order.status === 'paid') {
      return NextResponse.redirect(`${siteUrl}/orders/${orderId}/success`);
    }

    if (order.status === 'cancelled' || order.status === 'expired') {
      return NextResponse.redirect(`${siteUrl}/orders/${orderId}/failed?reason=${order.status}`);
    }

    // Convert searchParams to plain object for provider verification
    const rawParams: Record<string, string> = {};
    searchParams.forEach((value, key) => { rawParams[key] = value; });

    // Verify with the provider that handled this order
    const providerName = (order.payment_provider ?? 'billplz') as PaymentProviderName;
    const provider     = PaymentFactory.getProvider(providerName);
    const result       = await provider.verifyCallback({ rawParams, orderId });

    if (result.success && result.status === 'paid') {
      // Callback says paid — trigger DB confirmation
      // Note: The webhook is the authoritative source, but we handle the
      // redirect case here for immediate UX. Webhook may also fire separately.
      const { data: confirmed } = await supabaseAdmin.rpc('confirm_order_payment', {
        p_order_id:          orderId,
        p_payment_provider:  providerName,
        p_payment_reference: result.providerPaymentId,
        p_payment_metadata:  rawParams,
      });

      if (confirmed?.success || confirmed?.code === 'ALREADY_CONFIRMED') {
        return NextResponse.redirect(`${siteUrl}/orders/${orderId}/success`);
      }
    }

    // Payment failed or not verified
    return NextResponse.redirect(
      `${siteUrl}/orders/${orderId}/failed?reason=payment_${result.status}`
    );

  } catch (err) {
    console.error('[confirm] Unexpected error:', err);
    return NextResponse.redirect(`${siteUrl}/events?error=confirm_failed`);
  }
}
