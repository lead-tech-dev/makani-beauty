import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { NewsletterSubscriber } from './subscriber.entity';
import { PromoCode } from '../promo-codes/promo-code.entity';
import { PromoCodeType } from '../../common/enums/promo-code-type.enum';
import { EmailService } from '../email/email.service';
import { BrevoClient } from './brevo.client';

const WELCOME_DISCOUNT_PERCENT = 5;
const WELCOME_PROMO_VALIDITY_DAYS = 30;

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly frontendUrl: string;

  constructor(
    @InjectRepository(NewsletterSubscriber) private readonly subs: Repository<NewsletterSubscriber>,
    @InjectRepository(PromoCode) private readonly promoCodes: Repository<PromoCode>,
    private readonly email: EmailService,
    private readonly brevo: BrevoClient,
    config: ConfigService,
  ) {
    this.frontendUrl = (config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001').replace(/\/$/, '');
  }

  async subscribe(emailRaw: string, source?: string): Promise<{ status: 'pending' | 'already-confirmed'; alreadySubscribed: boolean }> {
    const email = emailRaw.trim().toLowerCase();

    let sub = await this.subs.findOne({ where: { email } });
    if (sub && sub.status === 'confirmed') {
      return { status: 'already-confirmed', alreadySubscribed: true };
    }

    const confirmationToken = sub?.confirmationToken ?? uuid();
    const unsubscribeToken = sub?.unsubscribeToken ?? uuid();

    if (!sub) {
      sub = this.subs.create({
        email,
        status: 'pending',
        source: source ?? null,
        confirmationToken,
        unsubscribeToken,
      });
    } else {
      sub.status = 'pending';
      sub.source = source ?? sub.source;
      sub.confirmationToken = confirmationToken;
      sub.unsubscribeToken = unsubscribeToken;
      sub.unsubscribedAt = null;
    }
    await this.subs.save(sub);

    const confirmUrl = `${this.frontendUrl}/newsletter/confirm?token=${confirmationToken}`;
    await this.email.sendNewsletterDoubleOptIn(email, confirmUrl).catch((err) =>
      this.logger.warn(`Double opt-in email failed: ${err.message}`),
    );

    return { status: 'pending', alreadySubscribed: false };
  }

  async confirm(token: string): Promise<{ email: string; promoCode: string | null }> {
    const sub = await this.subs.findOne({ where: { confirmationToken: token } });
    if (!sub) throw new NotFoundException('Lien de confirmation invalide ou expiré');
    if (sub.status === 'confirmed') {
      return { email: sub.email, promoCode: sub.welcomePromoCode };
    }
    sub.status = 'confirmed';
    sub.confirmedAt = new Date();
    sub.confirmationToken = null;

    // Generate single-use welcome promo code (-5%)
    const code = `WELCOME-${uuid().slice(0, 8).toUpperCase()}`;
    const promo = await this.promoCodes.save(
      this.promoCodes.create({
        code,
        type: PromoCodeType.PERCENTAGE,
        value: WELCOME_DISCOUNT_PERCENT,
        minOrderAmount: 0,
        maxUses: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + WELCOME_PROMO_VALIDITY_DAYS * 24 * 60 * 60 * 1000),
        isActive: true,
        description: `Newsletter welcome (-${WELCOME_DISCOUNT_PERCENT}%) — ${sub.email}`,
      }),
    );
    sub.welcomePromoCode = promo.code;
    await this.subs.save(sub);

    // Sync to Brevo (no-op in mock mode)
    try {
      const result = await this.brevo.upsertContact(sub.email, {
        SOURCE: sub.source ?? 'website',
        SUBSCRIBED_AT: new Date().toISOString().slice(0, 10),
      });
      if (result.id) {
        sub.brevoContactId = result.id;
        await this.subs.save(sub);
      }
    } catch (err: any) {
      this.logger.warn(`Brevo sync failed for ${sub.email}: ${err.message}`);
    }

    await this.email.sendNewsletterWelcome(sub.email, {
      promoCode: promo.code,
      percent: WELCOME_DISCOUNT_PERCENT,
      validUntil: promo.validUntil ?? new Date(),
      unsubscribeUrl: `${this.frontendUrl}/newsletter/unsubscribe?token=${sub.unsubscribeToken}`,
    }).catch((err) => this.logger.warn(`Welcome email failed: ${err.message}`));

    return { email: sub.email, promoCode: promo.code };
  }

  async unsubscribe(token: string): Promise<{ email: string }> {
    const sub = await this.subs.findOne({ where: { unsubscribeToken: token } });
    if (!sub) throw new NotFoundException('Lien de désinscription invalide');
    sub.status = 'unsubscribed';
    sub.unsubscribedAt = new Date();
    await this.subs.save(sub);

    await this.brevo.removeFromList(sub.email).catch((err) =>
      this.logger.warn(`Brevo remove failed: ${err.message}`),
    );

    return { email: sub.email };
  }
}
