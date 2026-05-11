import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { PaginatedDto } from '../../common/dto/paginated.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List products — search, filter, paginate, sort' })
  findAll(@Query() query: ProductQueryDto): Promise<PaginatedDto<Product>> {
    return this.productsService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Full-text search (Postgres tsvector + ILIKE fallback) — returns top N matches' })
  search(@Query('q') q: string, @Query('limit') limit?: string): Promise<Product[]> {
    return this.productsService.search(q ?? '', Math.min(Number(limit) || 10, 50));
  }

  @Get('facets')
  @ApiOperation({
    summary: 'Compute facet counts (hair type, skin type, ingredients, certifications, price range) within a given context',
  })
  facets(@Query() query: ProductQueryDto) {
    return this.productsService.getFacets(query);
  }

  @Get('low-stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] List products at or below stock alert threshold' })
  @ApiResponse({ status: 200, type: [Product] })
  getLowStock(): Promise<Product[]> {
    return this.productsService.getLowStock();
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a product by slug' })
  @ApiResponse({ status: 200, type: Product })
  findBySlug(@Param('slug') slug: string): Promise<Product> {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse({ status: 200, type: Product })
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create a product' })
  @ApiResponse({ status: 201, type: Product })
  create(@Body() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Update a product' })
  @ApiResponse({ status: 200, type: Product })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Soft-delete a product' })
  remove(@Param('id') id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
