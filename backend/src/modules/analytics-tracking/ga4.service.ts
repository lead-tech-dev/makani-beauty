import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { Order } from '../orders/order.entity';

interface GA4Item {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

/**
 * Server-side GA4 Measurement Protocol v2.
 *
 * Sends a duplicate `purchase` event from the backend so we get attribution
 * even when the client-side fire is blocked (ad blockers, browser closed
 * before redirect, page error before purchase event…).
 *
 * GTM client-side and Measurement Protocol server-side are deduplicated by
 * GA4 using the `transaction_id` field — same id = same transaction, no
 * double-counting.
 *
 * Mock mode if GA4_MEASUREMENT_ID + GA4_API_SECRET are not set.
 */
@Injectable()
export class GA4Service implements OnModuleInit {
  private readonly logger = new Logger(GA4Service.name);
  private measurementId: string | null = null;
  private apiSecret: string | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.measurementId = this.config.get<string>('GA4_MEASUREMENT_ID') ?? null;
    this.apiSecret = this.config.get<string>('GA4_API_SECRET') ?? null;
    if (!this.isEnabled) {
      this.logger.warn(
        'GA4 server-side tracking running in MOCK mode — set GA4_MEASUREMENT_ID and GA4_API_SECRET in .env to enable.',
      );
    }
  }

  get isEnabled(): boolean {
    return !!(this.measurementId && this.apiSecret);
  }

  async sendPurchase(order: Order, items: Array<{ productId: string; productName: string; unitPrice: number; quantity: number }>): Promise<void> {
    const userIdHash = createHash('sha256').update(String((order as any).userId)).digest('hex');
    // GA4 requires a stable client_id per user. We derive a deterministic one
    // from the user id (hashed) so all events for the same user join up.
    const clientId = userIdHash.slice(0, 16);

    const eventParams = {
      transaction_id: (order as any).orderNumber,
      value: Number((order as any).total),
      tax: Number((order as any).taxAmount ?? 0),
      shipping: Number((order as any).shippingFee ?? 0),
      currency: (order as any).currency ?? 'EUR',
      coupon: (order as any).discountCode ?? undefined,
      items: items.map<GA4Item>((it) => ({
        item_id: it.productId,
        item_name: it.productName,
        price: Number(it.unitPrice),
        quantity: it.quantity,
      })),
    };

    if (!this.isEnabled) {
      this.logger.log(`[mock] GA4 purchase ${eventParams.transaction_id} value=${eventParams.value}`);
      return;
    }

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          user_id: userIdHash,
          events: [{ name: 'purchase', params: eventParams }],
          // Fired from server, surfaced as such in DebugView.
          non_personalized_ads: false,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        this.logger.warn(`GA4 MP returned ${res.status}: ${body.slice(0, 200)}`);
      }
    } catch (err: any) {
      this.logger.warn(`GA4 MP send failed: ${err.message}`);
    }
  }
}
