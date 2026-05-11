import { Controller, Get, Header, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { DataExportService } from './data-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Account deletion (RGPD)')
@Controller('users/me')
export class DataExportController {
  constructor(private readonly service: DataExportService) {}

  @Get('data-export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Export all personal data as JSON (Article 20 RGPD — droit à la portabilité). Throttled to 1 export / 24h.',
  })
  @Header('Content-Type', 'application/json; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="makani-cosmetique-mes-donnees.json"')
  async export(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.service.generateExport(userId);
  }
}
