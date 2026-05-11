import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubProcessorsService } from './sub-processors.service';
import { SubProcessor } from './sub-processor.entity';
import { CreateSubProcessorDto, UpdateSubProcessorDto } from './dto/sub-processor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Sub-processors (DPA)')
@Controller('sub-processors')
export class SubProcessorsController {
  constructor(private readonly service: SubProcessorsService) {}

  @Get()
  @ApiOperation({ summary: 'List active sub-processors (public — for the /sous-traitants page)' })
  @ApiResponse({ status: 200, type: [SubProcessor] })
  findAllPublic(): Promise<SubProcessor[]> {
    return this.service.findAllPublic();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] List all sub-processors (including inactive)' })
  findAllAdmin(): Promise<SubProcessor[]> {
    return this.service.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  create(@Body() dto: CreateSubProcessorDto): Promise<SubProcessor> {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateSubProcessorDto): Promise<SubProcessor> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
