import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { Order } from '../../orders/order.entity';
import { User } from '../../users/user.entity';

const API_VERSION = 'v18.0';

interface PurchaseItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

const sha256 = (s: string): string =>
  createHash('sha256').update(s.trim().toLowerCase()).digest('hex');

const sha256Phone = (s: string | null | undefined): string | undefined => {
  if (!s) return undefined;
  // Strip all non-digit chars, keep leading + via E.164. Hash the digits-only form.
  const digits = s.replace(/[^\d]/g, '');
  return digits ? createHash('sha256').update(digits).digest('hex') : undefined;
};

const splitName = (full: string): { fn?: string; ln?: string } => {
  const parts = (full ?? '').trim().split(/\s+/);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { fn: parts[0] };
  return { fn: parts[0], ln: parts.slice(1).join(' ') };
};

/**
 * Meta Conversion API (CAPI) v18.0 — server-side Purchase tracking.
 *
 * Compensates ad-blockers and iOS 14.5+ ATT for Meta Ads attribution.
 * Deduplicated with the client-side Pixel via `event_id` (we use the order id).
 *
 * Mock mode if META_PIXEL_ID + META_CAPI_ACCESS_TOKEN are not set.
 *
 * Event matching uses hashed PII (email, phone, name, city, zip, country).
 * Higher match quality = better attribution. Including IP + user-agent + fbp/fbc
 * cookies pushes the match quality further but those need request context;
 * for now the server-side fire from confirmPayment uses only what's stored on
 * the order/user.
 */
@Injectable()
export class MetaCapiService implements OnModuleInit {
  private readonly logger = new Logger(MetaCapiService.name);
  private pixelId: string | null = null;
  private accessToken: string | null = null;
  private testEventCode: string | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.pixelId = this.config.get<string>('META_PIXEL_ID') ?? null;
    this.accessToken = this.config.get<string>('META_CAPI_ACCESS_TOKEN') ?? null;
    // Optional — set to a value from Meta Events Manager > Test Events to debug.
    this.testEventCode = this.config.get<string>('META_TEST_EVENT_CODE') ?? null;
    if (!this.isEnabled) {
      this.logger.warn(
        'Meta CAPI running in MOCK mode — set META_PIXEL_ID and META_CAPI_ACCESS_TOKEN in .env to enable.',
      );
    }
  }

  get isEnabled(): boolean {
    return !!(this.pixelId && this.accessToken);
  }

  async sendPurchase(order: Order, user: User | null, items: PurchaseItem[]): Promise<void> {
    const transactionId = (order as any).orderNumber as string;
    const value = Number((order as any).total ?? 0);
    const currency = (order as any).currency ?? 'EUR';
    const ship = (order as any).shippingSnapshot ?? {};

    const userData: Record<string, string | string[]> = {};
    if (user?.email) userData.em = sha256(user.email);
    if (user?.phone) {
      const ph = sha256Phone(user.phone);
      if (ph) userData.ph = ph;
    }
    if (user?.fullName) {
      const { fn, ln } = splitName(user.fullName);
      if (fn) userData.fn = sha256(fn);
      if (ln) userData.ln = sha256(ln);
    } else if (ship.fullName) {
      const { fn, ln } = splitName(ship.fullName);
      if (fn) userData.fn = sha256(fn);
      if (ln) userData.ln = sha256(ln);
    }
    if (ship.city) userData.ct = sha256(ship.city);
    if (ship.postalCode) userData.zp = sha256(String(ship.postalCode));
    if (ship.country) {
      // Meta expects ISO 3166-1 alpha-2 lowercased and hashed
      const code = String(ship.country).toLowerCase().slice(0, 2);
      userData.country = sha256(code);
    }
    if (user?.id) {
      // External ID = stable hashed user id, helps cross-device matching
      userData.external_id = sha256(user.id);
    }

    const customData = {
      currency,
      value,
      content_type: 'product',
      content_ids: items.map((it) => it.productId),
      contents: items.map((it) => ({
        id: it.productId,
        quantity: it.quantity,
        item_price: Number(it.unitPrice),
      })),
      num_items: items.reduce((acc, it) => acc + it.quantity, 0),
      order_id: transactionId,
    };

    const event = {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website',
      event_id: transactionId, // dedup with client-side Pixel
      user_data: userData,
      custom_data: customData,
    };

    if (!this.isEnabled) {
      this.logger.log(`[mock] Meta CAPI Purchase ${transactionId} value=${value} ${currency} items=${items.length}`);
      return;
    }

    const url = `https://graph.facebook.com/${API_VERSION}/${this.pixelId}/events?access_token=${this.accessToken}`;
    const body: Record<string, any> = { data: [event] };
    if (this.testEventCode) body.test_event_code = this.testEventCode;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        this.logger.warn(`Meta CAPI returned ${res.status}: ${text.slice(0, 300)}`);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { events_received?: number };
      this.logger.log(`Meta CAPI Purchase ${transactionId} accepted (${data.events_received ?? '?'} event(s) received)`);
    } catch (err: any) {
      this.logger.warn(`Meta CAPI send failed: ${err.message}`);
    }
  }
}
