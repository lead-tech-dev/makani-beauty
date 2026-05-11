import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Address } from '../addresses/address.entity';
import { Order } from '../orders/order.entity';
import { Favorite } from '../favorites/favorite.entity';
import { ReturnRequest } from '../returns/return-request.entity';
import { DataExportService } from './data-export.service';
import { DataExportController } from './data-export.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Address, Order, Favorite, ReturnRequest])],
  providers: [DataExportService],
  controllers: [DataExportController],
})
export class DataExportModule {}
