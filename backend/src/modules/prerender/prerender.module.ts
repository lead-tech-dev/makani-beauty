import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { Category } from '../categories/category.entity';
import { Brand } from '../brands/brand.entity';
import { LegalPage } from '../legal-pages/legal-page.entity';
import { PrerenderService } from './prerender.service';
import { PrerenderController } from './prerender.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, Brand, LegalPage])],
  providers: [PrerenderService],
  controllers: [PrerenderController],
})
export class PrerenderModule {}
