import {
  Controller, Get, Post, Patch, Delete, Res,
  Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { OrdersService } from './orders.service';
import { TrackingPollerService } from './tracking-poller.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ShipOrderDto } from './dto/ship-order.dto';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly service: OrdersService,
    private readonly tracking: TrackingPollerService,
  ) {}

  // ── Client routes ──────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.service.create(user.sub, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my orders' })
  findMine(@CurrentUser() user: JwtPayload) {
    return this.service.findByUser(user.sub);
  }

  @Get('my/:id')
  @ApiOperation({ summary: 'Get one of my orders by id' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.sub);
  }

  @Get('my/:id/events')
  @ApiOperation({ summary: 'Lister les évènements de suivi de mon colis' })
  listEvents(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.listEvents(id, user.sub);
  }

  @Post('my/:id/refresh-tracking')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forcer la mise à jour du suivi depuis le transporteur' })
  async refreshTracking(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const order = await this.service.findOne(id, user.sub);
    await this.tracking.refreshOne(order);
    return this.service.listEvents(id, user.sub);
  }

  @Get('my/:id/invoice')
  @ApiOperation({ summary: 'Télécharger la facture PDF de ma commande' })
  async myInvoice(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Res() res: Response) {
    const { invoice, pdf } = await this.service.getInvoiceForOrder(id, user.sub);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.number}.pdf"`);
    res.send(pdf);
  }

  @Delete('my/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending order' })
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.cancel(id, user.sub);
  }

  // ── Admin routes ───────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] List all orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
  ) {
    return this.service.findAll(Number(page) || 1, Number(limit) || 20, { status, paymentStatus });
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Get one order by id' })
  findOneAdmin(@Param('id') id: string) {
    return this.service.findOneAdmin(id);
  }

  @Get('admin/:id/invoice')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Télécharger la facture PDF de la commande' })
  async adminInvoice(@Param('id') id: string, @Res() res: Response) {
    const { invoice, pdf } = await this.service.getInvoiceForOrder(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.number}.pdf"`);
    res.send(pdf);
  }

  @Patch('admin/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Update order status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Post('admin/:id/ship')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Créer un envoi (label + tracking) et passer en SHIPPED' })
  ship(@Param('id') id: string, @Body() dto: ShipOrderDto) {
    return this.service.ship(id, { carrier: dto.carrier, weightOverrideGrams: dto.weightOverrideGrams });
  }

  @Get('admin/carriers/list')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Lister les transporteurs configurés' })
  listCarriers() {
    return this.service.listCarriers();
  }

  @Post('admin/labels/batch')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Télécharger un PDF concaténé des bordereaux sélectionnés' })
  async batchLabels(@Body() body: { orderIds: string[] }, @Res() res: Response) {
    const buf = await this.service.batchLabels(body?.orderIds ?? []);
    const ts = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="bordereaux-${ts}.pdf"`);
    res.send(Buffer.from(buf));
  }
}
