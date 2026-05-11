import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AccountDeletionService } from './account-deletion.service';
import { DeletionRequest } from './deletion-request.entity';
import { RequestDeletionDto } from './dto/request-deletion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

const userId = (req: Request): string => (req.user as any).id;

@ApiTags('Account deletion (RGPD)')
@Controller()
export class AccountDeletionController {
  constructor(private readonly service: AccountDeletionService) {}

  @Get('users/me/deletion-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the active deletion request for the current user' })
  @ApiResponse({ status: 200, type: DeletionRequest })
  async getMine(@Req() req: Request): Promise<DeletionRequest | null> {
    return this.service.getActiveRequest(userId(req));
  }

  @Post('users/me/deletion-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Request account deletion (Article 17 RGPD). 7-day grace period before anonymization.',
  })
  @ApiResponse({ status: 201, type: DeletionRequest })
  async create(@Req() req: Request, @Body() dto: RequestDeletionDto): Promise<DeletionRequest> {
    return this.service.createRequest(userId(req), dto.reason ?? null);
  }

  @Delete('users/me/deletion-request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel the pending deletion request (during the 7-day grace period)' })
  @ApiResponse({ status: 200, type: DeletionRequest })
  async cancel(@Req() req: Request): Promise<DeletionRequest> {
    return this.service.cancelRequest(userId(req));
  }

  @Get('admin/deletion-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] List all deletion requests (audit)' })
  @ApiResponse({ status: 200, type: [DeletionRequest] })
  async listAll(): Promise<DeletionRequest[]> {
    return this.service.listAllRequests();
  }
}
