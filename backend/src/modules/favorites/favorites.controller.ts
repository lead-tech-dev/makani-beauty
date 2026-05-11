import {
  Body, Controller, Get, Post, Delete, Param, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';

class ShareDto {
  @ApiProperty({ required: false, description: 'Optional note (max 200 chars)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

@ApiTags('favorites')
@Controller()
export class FavoritesController {
  constructor(private readonly service: FavoritesService) {}

  // ── Public: view a shared wishlist ─────────────────────────
  @Get('wishlists/:token')
  @ApiOperation({ summary: 'Public view of a shared wishlist (no auth required)' })
  publicWishlist(@Param('token') token: string) {
    return this.service.findPublicByToken(token);
  }

  // ── Authenticated: my favorites ────────────────────────────
  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my favorite products (full product objects)' })
  list(@CurrentUser() user: JwtPayload) {
    return this.service.list(user.sub);
  }

  @Get('favorites/ids')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the ids of my favorite products (lightweight)' })
  listIds(@CurrentUser() user: JwtPayload) {
    return this.service.listIds(user.sub);
  }

  @Post('favorites/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a product to my favorites' })
  add(@CurrentUser() user: JwtPayload, @Param('productId') productId: string) {
    return this.service.add(user.sub, productId);
  }

  @Delete('favorites/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a product from my favorites' })
  remove(@CurrentUser() user: JwtPayload, @Param('productId') productId: string) {
    return this.service.remove(user.sub, productId);
  }

  // ── Authenticated: wishlist sharing ────────────────────────
  @Post('favorites/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate (or reuse) a 30-day public share link for my wishlist' })
  share(@CurrentUser() user: JwtPayload, @Body() dto: ShareDto) {
    return this.service.getOrCreateShare(user.sub, dto.note ?? null);
  }

  @Delete('favorites/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke any active share link for my wishlist' })
  revokeShare(@CurrentUser() user: JwtPayload) {
    return this.service.revokeShare(user.sub);
  }
}
