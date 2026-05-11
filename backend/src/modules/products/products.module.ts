import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductVariantsController } from './product-variants.controller';
import { ProductVariantsService } from './product-variants.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant])],
  controllers: [ProductsController, ProductVariantsController],
  providers: [ProductsService, ProductVariantsService],
  exports: [ProductsService, ProductVariantsService],
})
export class ProductsModule {}
