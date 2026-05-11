import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { PaypalService } from './paypal.service';
import { PaymentsController } from './payments.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [StripeService, PaypalService],
  exports: [StripeService, PaypalService],
})
export class PaymentsModule {}
