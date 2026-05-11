import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { LegalPage } from '../legal-pages/legal-page.entity';
import { SeoService } from './seo.service';
import { SeoController } from './seo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Brand, LegalPage])],
  providers: [SeoService],
  controllers: [SeoController],
})
export class SeoModule {}
