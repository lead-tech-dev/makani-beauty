import {
  Controller, Post, UseGuards, UseInterceptors, UploadedFile,
  BadRequestException, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { StockService } from './stock.service';

const MAX_CSV_SIZE = 2 * 1024 * 1024; // 2 MB — plenty for any catalogue

@ApiTags('Stock')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('products/stock')
export class StockBulkController {
  constructor(private readonly service: StockService) {}

  @Post('bulk-import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Importer un CSV de mouvements de stock (sku, quantity, reason)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_CSV_SIZE },
    fileFilter: (_req, file, cb) => {
      const ok = file.mimetype === 'text/csv'
        || file.mimetype === 'application/vnd.ms-excel'
        || file.mimetype === 'application/octet-stream'
        || file.originalname.toLowerCase().endsWith('.csv');
      cb(ok ? null : new BadRequestException('Fichier CSV requis'), ok);
    },
  }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    const csv = file.buffer.toString('utf8');
    return this.service.bulkImport(csv);
  }
}
