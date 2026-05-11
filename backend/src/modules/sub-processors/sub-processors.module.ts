import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubProcessor } from './sub-processor.entity';
import { SubProcessorsService } from './sub-processors.service';
import { SubProcessorsController } from './sub-processors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SubProcessor])],
  providers: [SubProcessorsService],
  controllers: [SubProcessorsController],
})
export class SubProcessorsModule {}
