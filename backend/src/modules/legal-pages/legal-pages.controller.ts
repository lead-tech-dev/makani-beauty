import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LegalPagesService } from './legal-pages.service';
import { LegalPage } from './legal-page.entity';
import { UpdateLegalPageDto } from './dto/update-legal-page.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Legal pages')
@Controller('legal-pages')
export class LegalPagesController {
  constructor(private readonly service: LegalPagesService) {}

  @Get()
  @ApiOperation({ summary: 'List all legal pages' })
  @ApiResponse({ status: 200, type: [LegalPage] })
  findAll(): Promise<LegalPage[]> {
    return this.service.findAll();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a legal page by slug' })
  @ApiResponse({ status: 200, type: LegalPage })
  findOne(@Param('slug') slug: string): Promise<LegalPage> {
    return this.service.findBySlug(slug);
  }

  @Put(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update a legal page (markdown body)' })
  @ApiResponse({ status: 200, type: LegalPage })
  update(@Param('slug') slug: string, @Body() dto: UpdateLegalPageDto): Promise<LegalPage> {
    return this.service.update(slug, dto);
  }
}
