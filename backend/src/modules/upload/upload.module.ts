import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { ImageProcessorService } from './image-processor.service';

@Module({
  controllers: [UploadController],
  providers: [ImageProcessorService],
  exports: [ImageProcessorService],
})
export class UploadModule {}
