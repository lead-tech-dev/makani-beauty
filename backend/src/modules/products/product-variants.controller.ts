import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductVariantsService } from './product-variants.service';
import { UpsertVariantDto } from './dto/upsert-variant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('product-variants')
@Controller('products/:productId/variants')
export class ProductVariantsController {
  constructor(private readonly service: ProductVariantsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les variantes d’un produit (public)' })
  list(@Param('productId') productId: string) {
    return this.service.list(productId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer une variante (admin)' })
  create(@Param('productId') productId: string, @Body() dto: UpsertVariantDto) {
    return this.service.create(productId, dto);
  }

  @Patch(':variantId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour une variante (admin)' })
  update(@Param('variantId') variantId: string, @Body() dto: UpsertVariantDto) {
    return this.service.update(variantId, dto);
  }

  @Delete(':variantId')
  @HttpCode(204)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer une variante (admin)' })
  remove(@Param('variantId') variantId: string) {
    return this.service.remove(variantId);
  }
}
