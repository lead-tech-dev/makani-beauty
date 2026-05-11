import {
  Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateReturnDto } from './dto/create-return.dto';
import { ApproveReturnDto, RejectReturnDto } from './dto/process-return.dto';
import type { ReturnStatus } from './return-request.entity';

@ApiTags('returns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ReturnsController {
  constructor(private readonly service: ReturnsService) {}

  // ── User ────────────────────────────────────────────────

  @Post('orders/my/:orderId/returns')
  @ApiOperation({ summary: 'Demander un retour pour une de mes commandes' })
  create(
    @Param('orderId') orderId: string,
    @Body() dto: CreateReturnDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createForOrder(user.sub, orderId, dto);
  }

  @Get('orders/my/:orderId/returns')
  @ApiOperation({ summary: 'Mes demandes de retour pour une commande' })
  listForOrder(@Param('orderId') orderId: string, @CurrentUser() user: JwtPayload) {
    return this.service.listByUser(user.sub, orderId);
  }

  @Get('me/returns')
  @ApiOperation({ summary: 'Toutes mes demandes de retour' })
  listMine(@CurrentUser() user: JwtPayload) {
    return this.service.listByUser(user.sub);
  }

  // ── Admin ───────────────────────────────────────────────

  @Get('admin/returns')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Lister les demandes de retour' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected'] })
  listAdmin(@Query('status') status?: ReturnStatus) {
    return this.service.listAll({ status });
  }

  @Get('admin/returns/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] Détail d une demande de retour' })
  findOneAdmin(@Param('id') id: string) {
    return this.service.findOneAdmin(id);
  }

  @Post('admin/returns/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Approuver une demande (refund + retour stock)' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveReturnDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.approve(id, user.sub, { refundAmount: dto.refundAmount });
  }

  @Post('admin/returns/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[Admin] Rejeter une demande avec motif' })
  reject(
    @Param('id') id: string,
    @Body() dto: RejectReturnDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.reject(id, user.sub, dto.reason);
  }
}
