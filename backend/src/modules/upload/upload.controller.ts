import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';
import { ImageProcessorService } from './image-processor.service';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB (raises ceiling pre-compression)

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly processor: ImageProcessorService) {}

  @Post()
  @ApiOperation({
    summary:
      '[Auth] Upload an image (jpeg, png, webp, gif — max 8 MB). Server transcodes to WebP in 3 sizes (480/800/1600) and returns srcset + LQIP.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({
    status: 201,
    schema: {
      example: {
        url: '/uploads/abc123-1600.webp',
        srcset: '/uploads/abc123-480.webp 480w, /uploads/abc123-800.webp 800w, /uploads/abc123-1600.webp 1600w',
        lqip: 'data:image/webp;base64,UklGRi...',
        width: 1800,
        height: 1800,
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME.includes(file.mimetype)) {
          return cb(new BadRequestException('Only jpeg, png, webp, gif allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) throw new BadRequestException('No file provided');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.processor.process(file.buffer, baseUrl);
  }
}
