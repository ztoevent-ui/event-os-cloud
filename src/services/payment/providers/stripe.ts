// =============================================================================
// src/services/payment/providers/stripe.ts
// Stripe Payment Gateway Provider — International
// =============================================================================
// Stripe Docs: https://stripe.com/docs/api/payment_intents
//
// Flow (Stripe Checkout Sessions):
//   1. POST /v1/checkout/sessions → get checkout URL
//   2. User completes payment on Stripe-hosted page
//   3. Stripe redirects to successUrl with ?session_id=
//   4. Stripe sends webhook POST to /api/ticketing/webhook/stripe
//      (verify with stripe-signature header + webhook signing secret)
//
// Required env vars:
//   STRIPE_SECRET_KEY           — sk_live_... or sk_test_...
//   STRIPE_WEBHOOK_SECRET       — whsec_... from Stripe Dashboard → Webhooks
//   STRIPE_SUCCESS_URL_OVERRIDE — (optional) override for success redirect
//
// NOTE: The Stripe Node.js SDK is NOT used here to keep Edge compatibility.
// All calls use the Stripe REST API directly.
// If you add the 'stripe' npm package, uncomment the SDK version below.
// =============================================================================

import type {
  IPaymentProvider,
  CreatePaymentIntentParams,
  PaymentIntent,
  VerifyCallbackParams,
  PaymentCallbackResult,
  HandleWebhookParams,
  WebhookResult,
} from '../types';

export class StripeProvider implements IPaymentProvider {
  readonly providerName = 'stripe' as const;

  private readonly secretKey:     string;
  private readonly webhookSecret: string;
  private readonly apiBase:       string;

  constructor() {
    this.secretKey     = process.env.STRIPE_SECRET_KEY       ?? '';
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET   ?? '';
    this.apiBase       = 'https://api.stripe.com/v1';

    if (!this.secretKey) {
      console.warn('[StripeProvider] Missing STRIPE_SECRET_KEY');
    }
  }

  // ---------------------------------------------------------------------------
  // createPaymentIntent — Creates a Stripe Checkout Session
  // ---------------------------------------------------------------------------
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    const amountInCents = Math.round(params.amount * 100);

    const payload = new URLSearchParams({
      'mode':                                   'payment',
      'success_url':                            `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url':                             params.cancelUrl,
      'line_items[0][price_data][currency]':    params.currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]': params.description,
      'line_items[0][price_data][unit_amount]': amountInCents.toString(),
      'line_items[0][quantity]':                '1',
      'customer_email':                         params.customerEmail,
      'metadata[order_id]':                     params.orderId,
      'metadata[customer_name]':                params.customerName,
      // Expire after 30 min (Stripe minimum is 30 min, can't do 15)
      'expires_at': Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString(),
    });

    const response = await fetch(`${this.apiBase}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization':  `Bearer ${this.secretKey}`,
        'Content-Type':   'application/x-www-form-urlencoded',
        'Stripe-Version': '2024-06-20',
      },
      body: payload.toString(),
    });

    if (!response.ok) {
      const err = await response.json() as { error: { message: string } };
      throw new Error(`[Stripe] Checkout session failed: ${err.error?.message}`);
    }

    const session = await response.json() as {
      id:          string;
      url:         string;
      payment_intent: string;
      expires_at:  number;
      status:      string;
    };

    return {
      providerPaymentId: session.id,          // Checkout Session ID
      paymentUrl:        session.url,
      amountInCents,
      currency:          params.currency,
      expiresAt:         new Date(session.expires_at * 1000).toISOString(),
      providerData:      session as unknown as Record<string, unknown>,
    };
  }

  // ---------------------------------------------------------------------------
  // verifyCallback — Verify the session on return from Stripe Checkout
  // Stripe appends ?session_id= to the success URL
  // ---------------------------------------------------------------------------
  async verifyCallback(params: VerifyCallbackParams): Promise<PaymentCallbackResult> {
    const sessionId = params.rawParams['session_id'];

    if (!sessionId) {
      return {
        success: false, orderId: params.orderId,
        providerPaymentId: '', status: 'failed', rawData: params.rawParams,
      };
    }

    // Retrieve session from Stripe API to verify payment status
    const response = await fetch(`${this.apiBase}/checkout/sessions/${sessionId}`, {
      headers: {
        'Authorization':  `Bearer ${this.secretKey}`,
        'Stripe-Version': '2024-06-20',
      },
    });

    if (!response.ok) {
      return {
        success: false, orderId: params.orderId,
        providerPaymentId: sessionId, status: 'failed', rawData: params.rawParams,
      };
    }

    const session = await response.json() as {
      id:             string;
      payment_status: string;
      amount_total:   number;
      metadata:       Record<string, string>;
    };

    const paid     = session.payment_status === 'paid';
    const orderId  = session.metadata?.['order_id'] ?? params.orderId;

    return {
      success:           paid,
      orderId,
      providerPaymentId: sessionId,
      status:            paid ? 'paid' : 'pending',
      amountPaid:        paid ? session.amount_total / 100 : undefined,
      rawData:           params.rawParams,
    };
  }

  // ---------------------------------------------------------------------------
  // handleWebhook — Process Stripe webhook with signature verification
  // Stripe sends: stripe-signature header with t= and v1= components
  // ---------------------------------------------------------------------------
  async handleWebhook(params: HandleWebhookParams): Promise<WebhookResult> {
    const stripeSignature = params.headers['stripe-signature'];

    if (!stripeSignature || !this.webhookSecret) {
      return { processed: false, error: 'Missing Stripe-Signature or webhook secret' };
    }

    // Verify Stripe signature
    const isValid = await this.verifyStripeSignature(
      params.rawBody,
      stripeSignature,
      this.webhookSecret
    );

    if (!isValid) {
      return { processed: false, error: 'Stripe signature verification failed' };
    }

    // Parse event
    const event = JSON.parse(params.rawBody) as {
      id:     string;
      type:   string;
      data:   { object: Record<string, unknown> };
    };

    // Handle relevant event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          id:             string;
          payment_status: string;
          amount_total:   number;
          metadata:       Record<string, string>;
        };

        const orderId = session.metadata?.['order_id'];
        if (!orderId) {
          return { processed: false, error: 'No order_id in session metadata' };
        }

        return {
          processed:          true,
          orderId,
          providerPaymentId:  session.id,
          status:             session.payment_status === 'paid' ? 'paid' : 'pending',
          amountConfirmed:    session.amount_total / 100,
          rawEvent:           event as unknown as Record<string, unknown>,
        };
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string; metadata: Record<string, string> };
        return {
          processed:          true,
          orderId:            pi.metadata?.['order_id'],
          providerPaymentId:  pi.id,
          status:             'failed',
          rawEvent:           event as unknown as Record<string, unknown>,
        };
      }

      default:
        // Unhandled event type — acknowledge receipt without processing
        return {
          processed: true,
          rawEvent:  event as unknown as Record<string, unknown>,
        };
    }
  }

  // ---------------------------------------------------------------------------
  // Private: Stripe Webhook Signature Verification
  // Stripe signature format: t=<timestamp>,v1=<signature>
  // Signed payload = timestamp + '.' + rawBody
  // ---------------------------------------------------------------------------
  private async verifyStripeSignature(
    rawBody:    string,
    sigHeader:  string,
    secret:     string
  ): Promise<boolean> {
    try {
      const parts     = sigHeader.split(',');
      const tPart     = parts.find(p => p.startsWith('t='));
      const v1Part    = parts.find(p => p.startsWith('v1='));

      if (!tPart || !v1Part) return false;

      const timestamp = tPart.slice(2);
      const received  = v1Part.slice(3);

      // Stripe tolerance: reject webhooks older than 5 minutes
      const ts = parseInt(timestamp, 10);
      if (Math.abs(Date.now() / 1000 - ts) > 300) return false;

      const signedPayload = `${timestamp}.${rawBody}`;
      const encoder       = new TextEncoder();
      const keyData       = encoder.encode(secret);
      const msgData       = encoder.encode(signedPayload);

      const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );

      const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
      const computed  = Array.from(new Uint8Array(sigBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');

      return computed === received;
    } catch {
      return false;
    }
  }
}
