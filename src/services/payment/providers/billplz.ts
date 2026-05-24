// =============================================================================
// src/services/payment/providers/billplz.ts
// Billplz Payment Gateway Provider — Malaysia
// =============================================================================
// Billplz API v3 Docs: https://www.billplz.com/api
//
// Flow:
//   1. POST /v3/bills → create bill, get payment URL
//   2. User pays on Billplz-hosted page
//   3. Billplz redirects to successUrl with ?billplz[id]=&billplz[paid]=true&billplz[x_signature]=
//   4. Billplz sends webhook POST to /api/ticketing/webhook/billplz
//
// Required env vars:
//   BILLPLZ_API_KEY         — from Billplz Dashboard → Settings → API Key
//   BILLPLZ_COLLECTION_ID   — from Billplz Dashboard → Collections
//   BILLPLZ_X_SIGNATURE_KEY — from Billplz Dashboard → Settings → X Signature Key
//   BILLPLZ_SANDBOX         — 'true' for sandbox (www.billplz-sandbox.com)
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

export class BillplzProvider implements IPaymentProvider {
  readonly providerName = 'billplz' as const;

  private readonly apiKey:         string;
  private readonly collectionId:   string;
  private readonly xSignatureKey:  string;
  private readonly baseUrl:        string;

  constructor() {
    this.apiKey        = process.env.BILLPLZ_API_KEY        ?? '';
    this.collectionId  = process.env.BILLPLZ_COLLECTION_ID  ?? '';
    this.xSignatureKey = process.env.BILLPLZ_X_SIGNATURE_KEY ?? '';
    const sandbox      = process.env.BILLPLZ_SANDBOX === 'true';
    this.baseUrl       = sandbox
      ? 'https://www.billplz-sandbox.com/api'
      : 'https://www.billplz.com/api';

    if (!this.apiKey || !this.collectionId) {
      console.warn('[BillplzProvider] Missing BILLPLZ_API_KEY or BILLPLZ_COLLECTION_ID');
    }
  }

  // ---------------------------------------------------------------------------
  // createPaymentIntent — Creates a Billplz Bill and returns the payment URL
  // ---------------------------------------------------------------------------
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    // Billplz requires amount in cents (sen for MYR)
    const amountInCents = Math.round(params.amount * 100);

    const payload = new URLSearchParams({
      collection_id:      this.collectionId,
      email:              params.customerEmail,
      mobile:             params.customerPhone ?? '',
      name:               params.customerName,
      amount:             amountInCents.toString(),
      description:        params.description.slice(0, 200), // Max 200 chars
      callback_url:       `${process.env.NEXT_PUBLIC_SITE_URL}/api/ticketing/webhook/billplz`,
      redirect_url:       params.successUrl,
      // Pass orderId as reference_1 for reconciliation
      'reference_1_label': 'Order ID',
      'reference_1':       params.orderId,
    });

    const response = await fetch(`${this.baseUrl}/v3/bills`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`[Billplz] Failed to create bill: ${response.status} ${errorText}`);
    }

    const bill = await response.json() as {
      id:          string;
      url:         string;
      paid:        boolean;
      paid_at:     string | null;
      state:       string;
      // ... other Billplz fields
    };

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return {
      providerPaymentId: bill.id,
      paymentUrl:        bill.url,
      amountInCents,
      currency:          params.currency,
      expiresAt,
      providerData:      bill as Record<string, unknown>,
    };
  }

  // ---------------------------------------------------------------------------
  // verifyCallback — Verify the X-Signature on return redirect
  // Billplz appends: ?billplz[id]=&billplz[paid]=&billplz[x_signature]=
  // ---------------------------------------------------------------------------
  async verifyCallback(params: VerifyCallbackParams): Promise<PaymentCallbackResult> {
    const { rawParams } = params;

    const billId    = rawParams['billplz[id]'];
    const paid      = rawParams['billplz[paid]'] === 'true';
    const xSig      = rawParams['billplz[x_signature]'];
    const paidAt    = rawParams['billplz[paid_at]'];

    if (!billId) {
      return {
        success: false, orderId: params.orderId,
        providerPaymentId: '', status: 'failed', rawData: rawParams,
      };
    }

    // Verify X-Signature:
    // Billplz signature = HMAC-SHA256 of sorted query string (without x_signature key)
    const isValid = await this.verifyXSignature(rawParams, xSig);
    if (!isValid) {
      console.error('[Billplz] X-Signature verification failed', { billId });
      return {
        success: false, orderId: params.orderId,
        providerPaymentId: billId, status: 'failed', rawData: rawParams,
      };
    }

    return {
      success:           paid,
      orderId:           params.orderId,
      providerPaymentId: billId,
      status:            paid ? 'paid' : 'failed',
      rawData:           rawParams,
    };
  }

  // ---------------------------------------------------------------------------
  // handleWebhook — Process server-to-server Billplz callback
  // ---------------------------------------------------------------------------
  async handleWebhook(params: HandleWebhookParams): Promise<WebhookResult> {
    // Parse URL-encoded body (Billplz sends application/x-www-form-urlencoded)
    const formData = new URLSearchParams(params.rawBody);
    const rawParams: Record<string, string> = {};
    formData.forEach((v, k) => { rawParams[k] = v; });

    const billId  = rawParams['id'];
    const paid    = rawParams['paid'] === 'true';
    const orderId = rawParams['reference_1']; // We set this in createPaymentIntent
    const xSig    = rawParams['x_signature'];

    if (!billId || !orderId) {
      return { processed: false, error: 'Missing bill ID or order reference' };
    }

    // Verify signature
    const isValid = await this.verifyXSignature(rawParams, xSig);
    if (!isValid) {
      return { processed: false, error: 'Invalid X-Signature' };
    }

    return {
      processed:          true,
      orderId,
      providerPaymentId:  billId,
      status:             paid ? 'paid' : 'failed',
      rawEvent:           rawParams,
    };
  }

  // ---------------------------------------------------------------------------
  // Private: Billplz X-Signature Verification
  // Spec: HMAC-SHA256 of pipe-delimited sorted key=value pairs (excluding x_signature)
  // ---------------------------------------------------------------------------
  private async verifyXSignature(
    params: Record<string, string>,
    receivedSig: string
  ): Promise<boolean> {
    if (!this.xSignatureKey || !receivedSig) return false;

    // Build sorted string: key|value|key|value... (sorted by key, exclude x_signature)
    const parts = Object.entries(params)
      .filter(([k]) => k !== 'x_signature' && k !== 'billplz[x_signature]')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}${v}`)
      .join('|');

    const encoder  = new TextEncoder();
    const keyData  = encoder.encode(this.xSignatureKey);
    const msgData  = encoder.encode(parts);

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );

    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const computed  = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    return computed === receivedSig.toLowerCase();
  }
}
