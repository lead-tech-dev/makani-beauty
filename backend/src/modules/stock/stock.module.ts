import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './stock-movement.entity';
import { Product } from '../products/product.entity';
import { StockController } from './stock.controller';
import { StockBulkController } from './stock-bulk.controller';
import { StockService } from './stock.service';
import { StockAlertService } from './stock-alert.service';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, Product])],
  controllers: [StockBulkController, StockController],
  providers: [StockService, StockAlertService],
  exports: [StockService, StockAlertService],
})
export class StockModule {}
