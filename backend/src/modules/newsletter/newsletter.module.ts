import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsletterSubscriber } from './subscriber.entity';
import { PromoCode } from '../promo-codes/promo-code.entity';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { BrevoClient } from './brevo.client';

@Module({
  imports: [TypeOrmModule.forFeature([NewsletterSubscriber, PromoCode])],
  providers: [NewsletterService, BrevoClient],
  controllers: [NewsletterController],
})
export class NewsletterModule {}
