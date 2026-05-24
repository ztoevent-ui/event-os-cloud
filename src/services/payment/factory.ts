// =============================================================================
// src/services/payment/factory.ts
// Payment Provider Factory — ztoevent.com
// =============================================================================
// Usage:
//   const provider = PaymentFactory.getProvider('billplz');
//   const intent   = await provider.createPaymentIntent({ ... });
//
// To add a new gateway:
//   1. Create src/services/payment/providers/myprovider.ts implementing IPaymentProvider
//   2. Import it here and add to the PROVIDERS map
//   3. Add env vars to .env.local
//   Done — no other files need to change.
// =============================================================================

import type { IPaymentProvider, PaymentProviderName } from './types';
import { BillplzProvider  } from './providers/billplz';
import { SenangPayProvider } from './providers/senangpay';
import { StripeProvider   } from './providers/stripe';

// Registry of all available providers
// Instantiated lazily (only when first requested)
const PROVIDER_REGISTRY: Record<PaymentProviderName, () => IPaymentProvider> = {
  billplz:    () => new BillplzProvider(),
  senangpay:  () => new SenangPayProvider(),
  stripe:     () => new StripeProvider(),
  free:       () => new FreeProvider(),
};

// Cache instantiated providers (they hold no per-request state)
const providerCache = new Map<PaymentProviderName, IPaymentProvider>();

export class PaymentFactory {
  /**
   * Get a payment provider by name.
   * Providers are cached after first instantiation.
   *
   * @param name — Provider identifier ('billplz', 'senangpay', 'stripe', 'free')
   * @throws Error if the provider is not registered
   */
  static getProvider(name: PaymentProviderName): IPaymentProvider {
    if (providerCache.has(name)) {
      return providerCache.get(name)!;
    }

    const factory = PROVIDER_REGISTRY[name];
    if (!factory) {
      throw new Error(
        `[PaymentFactory] Unknown payment provider: "${name}". ` +
        `Available providers: ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
      );
    }

    const provider = factory();
    providerCache.set(name, provider);
    return provider;
  }

  /**
   * Get the default provider from environment config.
   * Set PAYMENT_DEFAULT_PROVIDER in your .env to control which gateway is active.
   */
  static getDefaultProvider(): IPaymentProvider {
    const defaultName = (process.env.PAYMENT_DEFAULT_PROVIDER ?? 'billplz') as PaymentProviderName;
    return PaymentFactory.getProvider(defaultName);
  }

  /**
   * List all registered provider names.
   */
  static getAvailableProviders(): PaymentProviderName[] {
    return Object.keys(PROVIDER_REGISTRY) as PaymentProviderName[];
  }
}

// =============================================================================
// Free / Zero-amount Provider
// Handles events where tickets are free (no payment gateway needed).
// Creates a "paid" order immediately without redirecting to a payment page.
// =============================================================================

import type {
  CreatePaymentIntentParams,
  PaymentIntent,
  VerifyCallbackParams,
  PaymentCallbackResult,
  HandleWebhookParams,
  WebhookResult,
} from './types';

class FreeProvider implements IPaymentProvider {
  readonly providerName = 'free' as const;

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent> {
    if (params.amount > 0) {
      throw new Error('[FreeProvider] Cannot use free provider for paid orders.');
    }

    return {
      providerPaymentId: `free-${params.orderId}`,
      paymentUrl:        params.successUrl,   // Redirect directly to success
      amountInCents:     0,
      currency:          params.currency,
      expiresAt:         new Date(Date.now() + 60 * 1000).toISOString(),
      providerData:      { provider: 'free', orderId: params.orderId },
    };
  }

  async verifyCallback(params: VerifyCallbackParams): Promise<PaymentCallbackResult> {
    return {
      success:           true,
      orderId:           params.orderId,
      providerPaymentId: `free-${params.orderId}`,
      status:            'paid',
      amountPaid:        0,
      rawData:           params.rawParams,
    };
  }

  async handleWebhook(_params: HandleWebhookParams): Promise<WebhookResult> {
    // Free tickets have no payment gateway webhooks
    return { processed: true };
  }
}
