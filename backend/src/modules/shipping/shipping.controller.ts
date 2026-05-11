import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { ShippingService } from './shipping.service';
import { CreateShippingZoneDto } from './dto/create-shipping-zone.dto';
import { UpdateShippingZoneDto } from './dto/update-shipping-zone.dto';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { CreateTierDto, UpdateTierDto } from './dto/tier.dto';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  // ── Public ──────────────────────────────────────────────────
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculer frais de port + TVA pour un pays + sous-total + items' })
  calculate(@Body() dto: CalculateShippingDto) {
    return this.service.calculate(dto.country, dto.subtotal, dto.items);
  }

  @Get('zones')
  @ApiOperation({ summary: 'Lister les zones de livraison (lecture publique)' })
  list() { return this.service.findAll(); }

  // ── Admin: zones ───────────────────────────────────────────
  @Post('zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Créer une zone' })
  create(@Body() dto: CreateShippingZoneDto) { return this.service.create(dto); }

  @Patch('zones/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: UpdateShippingZoneDto) {
    return this.service.update(id, dto);
  }

  @Delete('zones/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) { return this.service.remove(id); }

  // ── Admin: tiers (poids → prix) ────────────────────────────
  @Get('zones/:zoneId/tiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Lister les paliers de poids d une zone' })
  listTiers(@Param('zoneId') zoneId: string) {
    return this.service.listTiers(zoneId);
  }

  @Post('zones/:zoneId/tiers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Ajouter un palier de poids' })
  createTier(@Param('zoneId') zoneId: string, @Body() dto: CreateTierDto) {
    return this.service.createTier(zoneId, dto);
  }

  @Patch('zones/:zoneId/tiers/:tierId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Modifier un palier' })
  updateTier(
    @Param('zoneId') zoneId: string,
    @Param('tierId') tierId: string,
    @Body() dto: UpdateTierDto,
  ) {
    return this.service.updateTier(zoneId, tierId, dto);
  }

  @Delete('zones/:zoneId/tiers/:tierId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  removeTier(@Param('zoneId') zoneId: string, @Param('tierId') tierId: string) {
    return this.service.removeTier(zoneId, tierId);
  }
}
