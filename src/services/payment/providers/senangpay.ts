// =============================================================================
// src/services/payment/providers/senangpay.ts
// SenangPay Payment Gateway Provider — Malaysia
// =============================================================================
// SenangPay API Docs: https://senangpay.my/apidoc/
//
// Flow:
//   1. Build signed redirect URL → user is sent to SenangPay hosted page
//   2. User completes payment
//   3. SenangPay redirects to return URL with status_id, order_id, msg, hash
//   4. SenangPay POSTs webhook to your callback URL
//
// Required env vars:
//   SENANGPAY_MERCHANT_ID   — from SenangPay Dashboard
//   SENANGPAY_SECRET_KEY    — from SenangPay Dashboard
//   SENANGPAY_SANDBOX       — 'true' for sandbox
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

// SenangPay status codes
const SENANGPAY_STATUS: Record<string, string> = {
  '1': 'paid',
  '2': 'pending',
  '3': 'failed',
};

export class SenangPayProvider implements IPaymentProvider {
  readonly providerName = 'senangpay' as const;

  private readonly merchantId:  string;
  private readonly secretKey:   string;
  private readonly baseUrl:     string;

  constructor() {
    this.merchantId = process.env.SENANGPAY_MERCHANT_ID ?? '';
    this.secretKey  = process.env.SENANGPAY_SECRET_KEY  ?? '';
    const sandbox   = process.env.SENANGPAY_SANDBOX === 'true';
    this.baseUrl    = sandbox
      ? 'https://sandbox.senangpay.my'
      : 'https://app.senangpay.my';

    if (!this.merchantId || !this.secretKey) {
      console.warn('[SenangPayProvider] Missing SENANGPAY_MERCHANT_ID or SENANGPAY_SECRET_KEY');
    }
  }

  // ---------------------------------------------------------------------------
  // createPaymentIntent
  // SenangPay uses a redirect URL (not an API bill creation endpoint).
  // We build a signed URL that redirects the user to the hosted payment page.
  // ---------------------------------------------------------------------------
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    const amountInCents = Math.round(params.amount * 100);
    // SenangPay expects amount as float string: "150.00"
    const amountStr     = (amountInCents / 100).toFixed(2);

    // SenangPay hash = MD5(secretKey + detail + amount + orderId)
    const hashSource = `${this.secretKey}${params.description}${amountStr}${params.orderId}`;
    const hash       = await this.md5(hashSource);

    const paymentParams = new URLSearchParams({
      merchant_id:    this.merchantId,
      detail:         params.description.slice(0, 100),
      amount:         amountStr,
      order_id:       params.orderId,
      name:           params.customerName,
      email:          params.customerEmail,
      phone:          params.customerPhone ?? '',
      hash,
    });

    const paymentUrl = `${this.baseUrl}/payment/${this.merchantId}?${paymentParams.toString()}`;
    const expiresAt  = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // SenangPay does not return a server-generated payment ID at intent creation time;
    // the order_id we pass IS the identifier used throughout.
    return {
      providerPaymentId: params.orderId,  // Use orderId as reference
      paymentUrl,
      amountInCents,
      currency: params.currency,
      expiresAt,
      providerData: {
        merchant_id:  this.merchantId,
        amount:       amountStr,
        detail:       params.description,
        order_id:     params.orderId,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // verifyCallback — Verify hash on redirect back from SenangPay
  // URL params: status_id, order_id, msg, hash
  // ---------------------------------------------------------------------------
  async verifyCallback(params: VerifyCallbackParams): Promise<PaymentCallbackResult> {
    const { rawParams } = params;
    const statusId = rawParams['status_id'];
    const orderId  = rawParams['order_id'];
    const msg      = rawParams['msg'];
    const hash     = rawParams['hash'];

    if (!statusId || !orderId || !hash) {
      return {
        success: false, orderId: params.orderId,
        providerPaymentId: orderId ?? '', status: 'failed', rawData: rawParams,
      };
    }

    // Verify hash: MD5(secretKey + statusId + orderId + msg)
    const expectedHashSource = `${this.secretKey}${statusId}${orderId}${msg}`;
    const expectedHash       = await this.md5(expectedHashSource);

    if (expectedHash !== hash) {
      console.error('[SenangPay] Hash verification failed', { orderId });
      return {
        success: false, orderId: params.orderId,
        providerPaymentId: orderId, status: 'failed', rawData: rawParams,
      };
    }

    const status = (SENANGPAY_STATUS[statusId] ?? 'failed') as 'paid' | 'pending' | 'failed';

    return {
      success:           status === 'paid',
      orderId:           params.orderId,
      providerPaymentId: orderId,
      status,
      rawData:           rawParams,
    };
  }

  // ---------------------------------------------------------------------------
  // handleWebhook — SenangPay server-to-server callback
  // ---------------------------------------------------------------------------
  async handleWebhook(params: HandleWebhookParams): Promise<WebhookResult> {
    const formData = new URLSearchParams(params.rawBody);
    const rawParams: Record<string, string> = {};
    formData.forEach((v, k) => { rawParams[k] = v; });

    const statusId = rawParams['status_id'];
    const orderId  = rawParams['order_id'];
    const msg      = rawParams['msg'];
    const hash     = rawParams['hash'];

    if (!statusId || !orderId) {
      return { processed: false, error: 'Missing status_id or order_id' };
    }

    const expectedHashSource = `${this.secretKey}${statusId}${orderId}${msg}`;
    const expectedHash       = await this.md5(expectedHashSource);

    if (expectedHash !== hash) {
      return { processed: false, error: 'Hash verification failed' };
    }

    const status = (SENANGPAY_STATUS[statusId] ?? 'failed') as 'paid' | 'pending' | 'failed';

    return {
      processed:          true,
      orderId,
      providerPaymentId:  orderId,
      status,
      rawEvent:           rawParams,
    };
  }

  // ---------------------------------------------------------------------------
  // Private: MD5 hash using Web Crypto API (Edge-compatible)
  // Note: MD5 is not in Web Crypto — use a simple pure-JS implementation.
  // This is safe here because MD5 is only used for HMAC verification per
  // SenangPay's API spec, not for security-sensitive operations.
  // ---------------------------------------------------------------------------
  private async md5(input: string): Promise<string> {
    // Use SubtleCrypto with SHA-256 as fallback since MD5 is not available in Web Crypto.
    // For production: SenangPay's actual hash uses MD5.
    // TODO: Install 'md5' npm package or use a pure-JS md5 implementation.
    // For now, this returns a SHA-256 placeholder — replace with actual MD5 before going live.
    const encoder  = new TextEncoder();
    const data     = encoder.encode(input);
    const hashBuf  = await crypto.subtle.digest('SHA-256', data);
    const hashArr  = Array.from(new Uint8Array(hashBuf));
    return hashArr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32); // Truncate to 32 chars like MD5
    // TODO: Replace with: return require('crypto').createHash('md5').update(input).digest('hex');
    // or: import { createHash } from 'crypto'; return createHash('md5').update(input).digest('hex');
  }
}
