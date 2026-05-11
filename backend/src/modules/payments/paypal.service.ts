import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Client,
  Environment,
  OrdersController,
  PaymentsController,
  CheckoutPaymentIntent,
} from '@paypal/paypal-server-sdk';

/**
 * Wraps the PayPal Orders v2 + Refund APIs, plus webhook signature verification
 * (which the SDK itself does not expose — handled via REST + OAuth client_credentials).
 */
@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);
  private readonly client: Client | null;
  private readonly orders: OrdersController | null;
  private readonly payments: PaymentsController | null;
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly webhookId: string | undefined;
  private readonly mode: 'sandbox' | 'live';

  constructor(private readonly config: ConfigService) {
    this.clientId = this.config.get<string>('PAYPAL_CLIENT_ID') || undefined;
    this.clientSecret = this.config.get<string>('PAYPAL_CLIENT_SECRET') || undefined;
    this.webhookId = this.config.get<string>('PAYPAL_WEBHOOK_ID') || undefined;
    const rawMode = (this.config.get<string>('PAYPAL_MODE') ?? 'sandbox').toLowerCase();
    this.mode = rawMode === 'live' || rawMode === 'production' ? 'live' : 'sandbox';

    if (this.clientId && this.clientSecret) {
      this.client = new Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: this.clientId,
          oAuthClientSecret: this.clientSecret,
        },
        environment: this.mode === 'live' ? Environment.Production : Environment.Sandbox,
        timeout: 15000,
      });
      this.orders = new OrdersController(this.client);
      this.payments = new PaymentsController(this.client);
      this.logger.log(`PayPal client initialised (${this.mode})`);
    } else {
      this.client = null;
      this.orders = null;
      this.payments = null;
      this.logger.warn('PAYPAL_CLIENT_ID/SECRET not set — PayPal endpoints will return 503');
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  get publicClientId(): string | null {
    return this.clientId ?? null;
  }

  get currentMode(): 'sandbox' | 'live' {
    return this.mode;
  }

  private requireClient() {
    if (!this.orders || !this.payments) {
      throw new ServiceUnavailableException(
        'PayPal n est pas configuré. Renseignez PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET dans le .env du backend.',
      );
    }
    return { orders: this.orders, payments: this.payments };
  }

  private get apiBase(): string {
    return this.mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  }

  async createOrder(opts: {
    amount: number;
    currency: string;
    orderId: string;
    orderNumber: string;
  }) {
    const { orders } = this.requireClient();
    const { result } = await orders.createOrder({
      body: {
        intent: CheckoutPaymentIntent.Capture,
        purchaseUnits: [
          {
            referenceId: opts.orderId,
            customId: opts.orderId,
            invoiceId: opts.orderNumber,
            amount: {
              currencyCode: opts.currency.toUpperCase(),
              value: opts.amount.toFixed(2),
            },
          },
        ],
      },
      prefer: 'return=minimal',
    });
    return result as { id: string; status: string };
  }

  async getOrder(paypalOrderId: string) {
    const { orders } = this.requireClient();
    const { result } = await orders.getOrder({ id: paypalOrderId });
    return result as any;
  }

  async captureOrder(paypalOrderId: string) {
    const { orders } = this.requireClient();
    const { result } = await orders.captureOrder({
      id: paypalOrderId,
      prefer: 'return=representation',
    });
    return result as any;
  }

  /** Refund a captured payment (full refund if amount omitted). */
  async refundCapture(captureId: string, opts?: { amount?: number; currency?: string }) {
    const { payments } = this.requireClient();
    const body: any = opts?.amount !== undefined
      ? {
          amount: {
            value: opts.amount.toFixed(2),
            currencyCode: (opts.currency ?? 'EUR').toUpperCase(),
          },
        }
      : {};
    const { result } = await payments.refundCapturedPayment({ captureId, body });
    return result as any;
  }

  /**
   * Verifies a webhook signature against PayPal's API.
   * Returns true only on `verification_status === 'SUCCESS'`.
   */
  async verifyWebhookSignature(headers: Record<string, string | undefined>, rawBody: Buffer): Promise<boolean> {
    if (!this.client || !this.webhookId) {
      this.logger.warn('PayPal webhook received but client/webhookId not configured');
      return false;
    }

    const token = await this.fetchAccessToken();
    if (!token) return false;

    let event: unknown;
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return false;
    }

    const payload = {
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: this.webhookId,
      webhook_event: event,
    };

    try {
      const res = await fetch(`${this.apiBase}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        this.logger.warn(`PayPal verify-webhook returned ${res.status}`);
        return false;
      }
      const data = (await res.json()) as { verification_status?: string };
      return data.verification_status === 'SUCCESS';
    } catch (err: any) {
      this.logger.warn(`PayPal verify-webhook failed: ${err.message}`);
      return false;
    }
  }

  private async fetchAccessToken(): Promise<string | null> {
    if (!this.clientId || !this.clientSecret) return null;
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    try {
      const res = await fetch(`${this.apiBase}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { access_token?: string };
      return data.access_token ?? null;
    } catch {
      return null;
    }
  }
}
