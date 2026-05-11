import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { Brand } from './brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active brands' })
  @ApiResponse({ status: 200, type: [Brand] })
  findAll(): Promise<Brand[]> {
    return this.brandsService.findAll();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a brand by slug' })
  @ApiResponse({ status: 200, type: Brand })
  findBySlug(@Param('slug') slug: string): Promise<Brand> {
    return this.brandsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a brand by ID' })
  @ApiResponse({ status: 200, type: Brand })
  findOne(@Param('id') id: string): Promise<Brand> {
    return this.brandsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create a brand' })
  @ApiResponse({ status: 201, type: Brand })
  create(@Body() dto: CreateBrandDto): Promise<Brand> {
    return this.brandsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update a brand' })
  @ApiResponse({ status: 200, type: Brand })
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto): Promise<Brand> {
    return this.brandsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Soft-delete a brand' })
  @ApiResponse({ status: 204 })
  remove(@Param('id') id: string): Promise<void> {
    return this.brandsService.remove(id);
  }
}
