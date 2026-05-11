import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { Order } from '../../orders/order.entity';
import { User } from '../../users/user.entity';

const ENDPOINT = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

interface PurchaseItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

const sha256Lower = (s: string): string =>
  createHash('sha256').update(s.trim().toLowerCase()).digest('hex');

const sha256Phone = (s: string | null | undefined): string | undefined => {
  if (!s) return undefined;
  // E.164 digits-only is the standard for hashing phone numbers across pixels
  const digits = s.replace(/[^\d]/g, '');
  return digits ? createHash('sha256').update(digits).digest('hex') : undefined;
};

/**
 * TikTok Events API v1.3 — server-side CompletePayment tracking.
 *
 * Symmetric to Meta CAPI: compensates ad-blockers and iOS ATT,
 * deduplicated with the client-side TikTok Pixel via `event_id`.
 *
 * Mock mode if TIKTOK_PIXEL_CODE + TIKTOK_ACCESS_TOKEN are not set.
 *
 * Event matching uses hashed identifiers (email, phone_number, external_id).
 * Server-side fire from confirmPayment doesn't have request-time data
 * (ip, user_agent, ttclid, ttp cookie) — those are best provided by the
 * client-side pixel fire which TikTok then merges via event_id.
 */
@Injectable()
export class TikTokEventsService implements OnModuleInit {
  private readonly logger = new Logger(TikTokEventsService.name);
  private pixelCode: string | null = null;
  private accessToken: string | null = null;
  private testEventCode: string | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.pixelCode = this.config.get<string>('TIKTOK_PIXEL_CODE') ?? null;
    this.accessToken = this.config.get<string>('TIKTOK_ACCESS_TOKEN') ?? null;
    this.testEventCode = this.config.get<string>('TIKTOK_TEST_EVENT_CODE') ?? null;
    if (!this.isEnabled) {
      this.logger.warn(
        'TikTok Events API running in MOCK mode — set TIKTOK_PIXEL_CODE and TIKTOK_ACCESS_TOKEN in .env to enable.',
      );
    }
  }

  get isEnabled(): boolean {
    return !!(this.pixelCode && this.accessToken);
  }

  async sendCompletePayment(order: Order, user: User | null, items: PurchaseItem[]): Promise<void> {
    const transactionId = (order as any).orderNumber as string;
    const value = Number((order as any).total ?? 0);
    const currency = (order as any).currency ?? 'EUR';

    const userBlock: Record<string, string> = {};
    if (user?.email) userBlock.email = sha256Lower(user.email);
    if (user?.phone) {
      const ph = sha256Phone(user.phone);
      if (ph) userBlock.phone_number = ph;
    }
    if (user?.id) {
      userBlock.external_id = sha256Lower(user.id);
    }

    const properties = {
      value,
      currency,
      contents: items.map((it) => ({
        content_id: it.productId,
        content_type: 'product',
        content_name: it.productName,
        quantity: it.quantity,
        price: Number(it.unitPrice),
      })),
      // Single content_ids array helps TikTok DPA / catalogue matching
      content_ids: items.map((it) => it.productId),
      content_type: 'product',
      num_items: items.reduce((acc, it) => acc + it.quantity, 0),
      order_id: transactionId,
    };

    const event = {
      event: 'CompletePayment',
      event_time: Math.floor(Date.now() / 1000),
      event_id: transactionId, // dedup with client-side Pixel
      user: userBlock,
      properties,
      page: { url: undefined as string | undefined },
    };

    if (!this.isEnabled) {
      this.logger.log(`[mock] TikTok CompletePayment ${transactionId} value=${value} ${currency} items=${items.length}`);
      return;
    }

    const body: Record<string, any> = {
      event_source: 'web',
      event_source_id: this.pixelCode,
      data: [event],
    };
    if (this.testEventCode) body.test_event_code = this.testEventCode;

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Access-Token': this.accessToken!,
        },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { code?: number; message?: string; data?: any };
      if (!res.ok || json.code !== 0) {
        this.logger.warn(`TikTok Events API returned ${res.status} code=${json.code} message=${json.message ?? 'no message'}`);
        return;
      }
      this.logger.log(`TikTok CompletePayment ${transactionId} accepted`);
    } catch (err: any) {
      this.logger.warn(`TikTok Events API send failed: ${err.message}`);
    }
  }
}
