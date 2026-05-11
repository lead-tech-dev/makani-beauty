import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { ShipmentEvent } from './shipment-event.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { Address } from '../addresses/address.entity';
import { StockMovement } from '../stock/stock-movement.entity';
import { User } from '../users/user.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TrackingPollerService } from './tracking-poller.service';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';
import { ShippingModule } from '../shipping/shipping.module';
import { CarriersModule } from '../carriers/carriers.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, ShipmentEvent, Product, ProductVariant, Address, StockMovement, User]),
    PromoCodesModule,
    ShippingModule,
    CarriersModule,
    InvoicesModule,
    StockModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, TrackingPollerService],
  exports: [OrdersService],
})
export class OrdersModule {}
