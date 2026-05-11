import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReturnRequest } from './return-request.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Product } from '../products/product.entity';
import { StockMovement } from '../stock/stock-movement.entity';
import { User } from '../users/user.entity';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReturnRequest, Order, OrderItem, Product, StockMovement, User]),
    PaymentsModule,
  ],
  controllers: [ReturnsController],
  providers: [ReturnsService],
  exports: [ReturnsService],
})
export class ReturnsModule {}
