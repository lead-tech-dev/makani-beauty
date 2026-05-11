import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: ReturnType<typeof Stripe> | null;
  private readonly webhookSecret: string | undefined;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');

    if (secretKey) {
      this.client = new Stripe(secretKey, { apiVersion: '2024-09-30.acacia' as any });
      this.logger.log('Stripe client initialised');
    } else {
      this.client = null;
      this.logger.warn('STRIPE_SECRET_KEY not set — payment endpoints will return 503');
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  get publishableKey(): string | null {
    return this.config.get<string>('STRIPE_PUBLISHABLE_KEY') ?? null;
  }

  private requireClient() {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Stripe is not configured. Set STRIPE_SECRET_KEY in the backend env.',
      );
    }
    return this.client;
  }

  async createPaymentIntent(opts: {
    amount: number;          // in major units (e.g. 12.99 EUR)
    currency: string;        // ISO 4217 (e.g. 'eur')
    orderId: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }) {
    const stripe = this.requireClient();
    return stripe.paymentIntents.create({
      // Stripe expects amounts in the smallest currency unit (cents)
      amount: Math.round(opts.amount * 100),
      currency: opts.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      receipt_email: opts.customerEmail,
      metadata: { orderId: opts.orderId, ...(opts.metadata ?? {}) },
    });
  }

  async retrieveIntent(paymentIntentId: string) {
    return this.requireClient().paymentIntents.retrieve(paymentIntentId);
  }

  async createRefund(paymentIntentId: string, opts?: { amount?: number; reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' }) {
    const stripe = this.requireClient();
    return stripe.refunds.create({
      payment_intent: paymentIntentId,
      ...(opts?.amount !== undefined ? { amount: Math.round(opts.amount * 100) } : {}),
      reason: opts?.reason ?? 'requested_by_customer',
    });
  }

  /**
   * Verify a webhook payload's signature and parse it into a Stripe event.
   * Throws if signature is invalid or the secret isn't configured.
   */
  constructEvent(rawBody: Buffer, signature: string) {
    const stripe = this.requireClient();
    if (!this.webhookSecret) {
      throw new ServiceUnavailableException(
        'STRIPE_WEBHOOK_SECRET not set — cannot verify webhook',
      );
    }
    return stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }
}
