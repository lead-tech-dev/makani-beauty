import {
  Controller, Post, Get, Body, Req, Res, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { JwtPayload } from './decorators/current-user.decorator';
import { User } from '../users/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private get googleEnabled(): boolean {
    return !!this.config.get<string>('GOOGLE_CLIENT_ID');
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Creer un compte client' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Se connecter (email + mot de passe)' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  login(@CurrentUser() user: User, @Req() req: Request): Promise<AuthResponseDto> {
    return this.authService.login(user, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Echanger un refresh token contre une nouvelle paire' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  refresh(@Body() dto: RefreshTokenDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refresh_token, {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoquer un refresh token (logout)' })
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refresh_token);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoquer toutes les sessions de l utilisateur' })
  async logoutAll(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.authService.logoutAll(user.sub);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil de l utilisateur connecte' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  getMe(@CurrentUser() user: JwtPayload): Promise<UserProfileDto> {
    return this.authService.getMe(user.sub);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Demander un email de reinitialisation' })
  @ApiResponse({ status: 200, description: 'Email envoye si le compte existe' })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email, dto.captchaToken);
    return {
      message: 'Si un compte est associe a cet email, un lien de reinitialisation a ete envoye.',
    };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reinitialiser le mot de passe via le token recu par email' })
  @ApiResponse({ status: 200, description: 'Mot de passe mis a jour' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Mot de passe mis a jour avec succes.' };
  }

  // ── Email verification ─────────────────────────────────────

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmer une adresse email via le token recu' })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    await this.authService.verifyEmail(dto.token);
    return { message: 'Email vérifié avec succès.' };
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renvoyer l email de verification' })
  async resendVerification(@Body() dto: ResendVerificationDto): Promise<{ message: string }> {
    await this.authService.resendVerification(dto.email);
    return {
      message: 'Si un compte non vérifié existe avec cet email, un nouveau lien a été envoyé.',
    };
  }

  // ── Providers ──────────────────────────────────────────────

  @Get('providers')
  @ApiOperation({ summary: 'Lister les providers d auth disponibles' })
  providers(): { local: boolean; google: boolean } {
    return { local: true, google: this.googleEnabled };
  }

  // ── Google OAuth ───────────────────────────────────────────

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Demarrer le flow Google OAuth' })
  googleAuth(): void {
    // The guard initiates the redirect to Google's consent screen.
    // This handler body is never executed in practice.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Callback Google OAuth (redirige vers le frontend)' })
  async googleCallback(
    @CurrentUser() user: User,
    @Res() res: Response,
  ): Promise<void> {
    const { access_token } = await this.authService.login(user);
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
    res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(access_token)}`);
  }
}
