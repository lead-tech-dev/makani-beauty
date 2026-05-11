import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LegalPage } from './legal-page.entity';
import { LegalPagesService } from './legal-pages.service';
import { LegalPagesController } from './legal-pages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LegalPage])],
  controllers: [LegalPagesController],
  providers: [LegalPagesService],
})
export class LegalPagesModule {}
