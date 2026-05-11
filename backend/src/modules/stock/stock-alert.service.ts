import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Product } from '../products/product.entity';
import { EmailService } from '../email/email.service';

/**
 * Pushes stock-related notifications to the admin :
 *   - rupture : instant email when a product transitions from > 0 to 0
 *   - digest  : daily 8h récap of every product currently low or out
 *
 * Both are gated by ADMIN_ALERTS_ENABLED (default true) and routed to
 * ADMIN_ALERT_EMAIL (falls back to MAIL_FROM_ADDRESS).
 */
@Injectable()
export class StockAlertService {
  private readonly logger = new Logger(StockAlertService.name);

  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  // ── Public API ──────────────────────────────────────────────

  /**
   * Call after any stock decrement. Fires the rupture email exactly when the
   * stock crosses from > 0 to 0 (no spam if a product stays at 0).
   */
  async notifyIfNewlyOutOfStock(productId: string, previousStock: number, newStock: number, orderNumber?: string): Promise<void> {
    if (!this.enabled) return;
    if (previousStock > 0 && newStock <= 0) {
      try {
        const product = await this.productRepo.findOne({ where: { id: productId } });
        if (!product) return;
        const to = this.recipient;
        if (!to) return;
        await this.email.sendStockAlert(to, {
          kind: 'rupture',
          product: {
            name: product.name,
            sku: product.sku,
            stock: product.stock,
            stockAlert: product.stockAlert,
          },
          adminUrl: `${this.frontendUrl}/admin/products/${product.id}`,
          orderNumber,
        });
        this.logger.log(`Rupture alert sent for ${product.name}`);
      } catch (err: any) {
        this.logger.warn(`Rupture alert failed: ${err.message}`);
      }
    }
  }

  // ── Daily digest (8h) ───────────────────────────────────────

  @Cron('0 8 * * *', { timeZone: 'Europe/Paris' })
  async sendDailyDigest(): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.runDigest();
    } catch (err: any) {
      this.logger.warn(`Daily stock digest failed: ${err.message}`);
    }
  }

  /** Exposed for manual trigger (admin endpoint or test). */
  async runDigest(): Promise<{ outOfStock: number; lowStock: number; sent: boolean }> {
    const to = this.recipient;
    if (!to) {
      this.logger.warn('No recipient configured for stock digest — skipping');
      return { outOfStock: 0, lowStock: 0, sent: false };
    }

    // Active products only — we don't want to spam about retired SKUs.
    const products = await this.productRepo.find({ where: { isActive: true } });

    const outOfStock = products
      .filter((p) => p.stock <= 0)
      .map(toDigestEntry);
    const lowStock = products
      .filter((p) => p.stock > 0 && p.stock <= p.stockAlert)
      .map(toDigestEntry);

    const sendOnQuiet = (this.config.get<string>('ADMIN_ALERTS_QUIET') ?? '').toLowerCase() === 'true';
    if (outOfStock.length === 0 && lowStock.length === 0 && !sendOnQuiet) {
      // Skip the noise — admin doesn't need a "all good" email every morning unless they ask.
      return { outOfStock: 0, lowStock: 0, sent: false };
    }

    await this.email.sendStockAlert(to, {
      kind: 'digest',
      outOfStock,
      lowStock,
      adminUrl: `${this.frontendUrl}/admin/products`,
    });
    this.logger.log(`Stock digest sent — ${outOfStock.length} out, ${lowStock.length} low`);
    return { outOfStock: outOfStock.length, lowStock: lowStock.length, sent: true };
  }

  // ── Helpers ─────────────────────────────────────────────────

  private get enabled(): boolean {
    const v = (this.config.get<string>('ADMIN_ALERTS_ENABLED') ?? 'true').toLowerCase();
    return v !== 'false' && v !== '0';
  }

  private get recipient(): string | null {
    return this.config.get<string>('ADMIN_ALERT_EMAIL')
      || this.config.get<string>('MAIL_FROM_ADDRESS')
      || null;
  }

  private get frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
  }
}

function toDigestEntry(p: Product) {
  return { name: p.name, sku: p.sku, stock: p.stock, stockAlert: p.stockAlert };
}

// silence unused
void LessThanOrEqual;
