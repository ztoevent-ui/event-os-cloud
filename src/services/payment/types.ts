// =============================================================================
// src/services/payment/types.ts
// Abstract Payment Gateway Interface — ztoevent.com
// =============================================================================
// Architecture: Strategy Pattern
//   - IPaymentProvider defines the contract every gateway must implement
//   - Each provider (Billplz, SenangPay, Stripe) is a concrete strategy
//   - PaymentFactory selects the correct strategy at runtime
//   - Adding a new gateway = create one class + register in factory
// =============================================================================

// ---------------------------------------------------------------------------
// INPUT TYPES
// ---------------------------------------------------------------------------

export interface CreatePaymentIntentParams {
  /** Unique order reference in your system */
  orderId:        string;
  /** Total charge amount (e.g., 150.00) */
  amount:         number;
  /** ISO 4217 currency code (e.g., 'MYR', 'USD') */
  currency:       string;
  /** Human-readable description shown on payment page */
  description:    string;
  /** Customer's full name */
  customerName:   string;
  /** Customer's email address */
  customerEmail:  string;
  /** Customer's phone number (required by some MY gateways) */
  customerPhone?: string;
  /** URL to redirect after successful payment */
  successUrl:     string;
  /** URL to redirect after cancelled/failed payment */
  cancelUrl:      string;
  /** Arbitrary metadata to pass through to gateway (gateway-specific) */
  metadata?:      Record<string, string>;
}

export interface VerifyCallbackParams {
  /** Raw query params or body from the gateway redirect/callback */
  rawParams:  Record<string, string>;
  /** The original order ID from your system */
  orderId:    string;
}

export interface HandleWebhookParams {
  /** Raw request body as string (for signature verification) */
  rawBody:    string;
  /** Request headers (for signature extraction) */
  headers:    Record<string, string>;
}

// ---------------------------------------------------------------------------
// RESULT TYPES
// ---------------------------------------------------------------------------

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentIntent {
  /** Provider-assigned payment/bill ID */
  providerPaymentId:  string;
  /** URL to redirect the user to for payment (hosted payment page) */
  paymentUrl:         string;
  /** Amount in the smallest currency unit (e.g., cents for USD, sen for MYR) */
  amountInCents:      number;
  /** Currency code */
  currency:           string;
  /** ISO 8601 expiry timestamp for this payment intent */
  expiresAt:          string;
  /** Raw provider response (for audit logging) */
  providerData:       Record<string, unknown>;
}

export interface PaymentCallbackResult {
  /** Whether the payment was successful */
  success:            boolean;
  /** Your internal order ID */
  orderId:            string;
  /** Provider-assigned payment ID (for reconciliation) */
  providerPaymentId:  string;
  /** Verified payment status */
  status:             PaymentStatus;
  /** Amount paid (as verified by provider) */
  amountPaid?:        number;
  /** Original raw params (for audit logging) */
  rawData:            Record<string, string>;
}

export interface WebhookResult {
  /** Whether the webhook was successfully processed */
  processed:          boolean;
  /** Your internal order ID extracted from webhook payload */
  orderId?:           string;
  /** Provider-assigned payment ID */
  providerPaymentId?: string;
  /** Final payment status */
  status?:            PaymentStatus;
  /** Amount confirmed by provider */
  amountConfirmed?:   number;
  /** Error message if processing failed */
  error?:             string;
  /** Full parsed webhook event (for logging) */
  rawEvent?:          Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// PROVIDER INTERFACE — every gateway must implement this
// ---------------------------------------------------------------------------

export interface IPaymentProvider {
  /** Unique identifier for this provider (used in DB records and routing) */
  readonly providerName: string;

  /**
   * Initiate a payment.
   * Creates a bill/payment intent on the provider and returns the redirect URL.
   * Called by: POST /api/ticketing/reserve (after order is created in DB)
   */
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent>;

  /**
   * Verify the redirect callback after user returns from payment page.
   * Gateway appends query params to successUrl/cancelUrl — verify their integrity.
   * Called by: GET/POST /api/ticketing/confirm (browser redirect back)
   */
  verifyCallback(params: VerifyCallbackParams): Promise<PaymentCallbackResult>;

  /**
   * Handle server-to-server webhook notification from gateway.
   * This is the authoritative payment confirmation — always verify signature.
   * Called by: POST /api/ticketing/webhook/[provider]
   */
  handleWebhook(params: HandleWebhookParams): Promise<WebhookResult>;
}

// ---------------------------------------------------------------------------
// PROVIDER NAMES (string literal union for type safety)
// ---------------------------------------------------------------------------

export type PaymentProviderName = 'billplz' | 'senangpay' | 'stripe' | 'free';
