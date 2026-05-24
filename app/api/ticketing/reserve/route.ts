// =============================================================================
// app/api/ticketing/reserve/route.ts
// POST — Reserve tickets and create payment intent
// =============================================================================
// Flow:
//   1. Validate authenticated user
//   2. Call reserve_ticket_and_create_order RPC (handles concurrency + capacity)
//   3. If reserved, call payment gateway createPaymentIntent
//   4. Update order with payment reference + URL
//   5. Return payment URL to client
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/src/lib/supabase/server';
import { supabaseAdmin, callReserveTicket } from '@/src/lib/supabase/admin';
import { PaymentFactory } from '@/src/services/payment/factory';
import type { PaymentProviderName } from '@/src/services/payment/types';

export const runtime = 'nodejs'; // Use Node.js runtime (not Edge) for this route

interface ReserveRequestBody {
  tierId:          string;
  quantity:        number;
  paymentProvider?: PaymentProviderName;
}

export async function POST(request: NextRequest) {
  try {
    // ------------------------------------------------------------------
    // 1. Authenticate the user
    // ------------------------------------------------------------------
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'You must be logged in to purchase tickets.' },
        { status: 401 }
      );
    }

    // ------------------------------------------------------------------
    // 2. Parse and validate request body
    // ------------------------------------------------------------------
    let body: ReserveRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, code: 'INVALID_BODY', message: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { tierId, quantity, paymentProvider = 'billplz' } = body;

    if (!tierId || typeof tierId !== 'string') {
      return NextResponse.json(
        { success: false, code: 'MISSING_TIER_ID', message: 'tierId is required.' },
        { status: 400 }
      );
    }

    if (!quantity || typeof quantity !== 'number' || quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { success: false, code: 'INVALID_QUANTITY', message: 'quantity must be between 1 and 10.' },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // 3. Fetch user profile for buyer info
    // ------------------------------------------------------------------
    const { data: profile } = await supabaseAdmin
      .from('zt_profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();

    const buyerName  = profile?.full_name ?? user.email?.split('@')[0] ?? 'Buyer';
    const buyerEmail = user.email ?? '';
    const buyerPhone = profile?.phone ?? undefined;

    // ------------------------------------------------------------------
    // 4. Call the anti-oversell RPC
    // ------------------------------------------------------------------
    const reservation = await callReserveTicket({
      p_tier_id:      tierId,
      p_user_id:      user.id,
      p_quantity:     quantity,
      p_buyer_name:   buyerName,
      p_buyer_email:  buyerEmail,
      p_buyer_phone:  buyerPhone,
    });

    if (!reservation.success) {
      // Return the exact error code from the RPC (OUT_OF_STOCK, SALES_CLOSED, etc.)
      return NextResponse.json(reservation, { status: 409 });
    }

    // ------------------------------------------------------------------
    // 5. Create payment intent with the selected gateway
    // ------------------------------------------------------------------
    const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ztoevent.com';
    const provider = PaymentFactory.getProvider(paymentProvider);

    let paymentIntent;
    try {
      paymentIntent = await provider.createPaymentIntent({
        orderId:       reservation.order_id!,
        amount:        reservation.total_amount!,
        currency:      reservation.currency ?? 'MYR',
        description:   `${reservation.tier_name} × ${quantity}`,
        customerName:  buyerName,
        customerEmail: buyerEmail,
        customerPhone: buyerPhone,
        successUrl:    `${siteUrl}/api/ticketing/confirm?order_id=${reservation.order_id}`,
        cancelUrl:     `${siteUrl}/events?cancelled=1`,
      });
    } catch (err) {
      // Payment gateway failed — restore capacity by cancelling the order
      await supabaseAdmin.rpc('zt_cancel_pending_order', { p_order_id: reservation.order_id });
      console.error('[reserve] Payment intent creation failed:', err);
      return NextResponse.json(
        { success: false, code: 'PAYMENT_GATEWAY_ERROR', message: 'Failed to initialize payment. Please try again.' },
        { status: 502 }
      );
    }

    // ------------------------------------------------------------------
    // 6. Update order with payment gateway details
    // ------------------------------------------------------------------
    await supabaseAdmin
      .from('zt_orders')
      .update({
        status:             'awaiting_payment',
        payment_provider:   provider.providerName,
        payment_reference:  paymentIntent.providerPaymentId,
        payment_url:        paymentIntent.paymentUrl,
        payment_metadata:   paymentIntent.providerData,
      })
      .eq('id', reservation.order_id);

    // ------------------------------------------------------------------
    // 7. Return success with payment URL
    // ------------------------------------------------------------------
    return NextResponse.json({
      success:            true,
      order_id:           reservation.order_id,
      payment_url:        paymentIntent.paymentUrl,
      provider:           provider.providerName,
      total_amount:       reservation.total_amount,
      currency:           reservation.currency,
      expires_at:         reservation.expires_at,
    });

  } catch (err) {
    console.error('[reserve] Unexpected error:', err);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
