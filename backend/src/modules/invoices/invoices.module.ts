import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './invoice.entity';
import { InvoiceCounter } from './invoice-counter.entity';
import { Order } from '../orders/order.entity';
import { OrderItem } from '../orders/order-item.entity';
import { User } from '../users/user.entity';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, InvoiceCounter, Order, OrderItem, User])],
  providers: [InvoiceService],
  exports: [InvoiceService],
})
export class InvoicesModule {}
