import {
  Injectable, ConflictException, BadRequestException, UnauthorizedException, Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { EmailService } from '../email/email.service';
import { CaptchaService } from '../captcha/captcha.service';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;             // 1h
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;       // 24h
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30d
const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;            // 15min

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
    @InjectRepository(EmailVerificationToken)
    private readonly verifyTokenRepo: Repository<EmailVerificationToken>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @Optional()
    private readonly captcha?: CaptchaService,
  ) {}

  // ── Login ───────────────────────────────────────────────────

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive || !user.password) return null;

    // Account currently locked?
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Compte temporairement verrouillé. Réessayez dans ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;
      if (user.failedLoginAttempts >= LOCKOUT_MAX_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        user.failedLoginAttempts = 0;
      }
      await this.usersService.save(user);
      return null;
    }

    // Successful login — reset counters if needed
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      await this.usersService.save(user);
    }

    return user;
  }

  async login(user: User, meta: { userAgent?: string; ip?: string } = {}): Promise<AuthResponseDto> {
    const refresh_token = await this.issueRefreshToken(user.id, meta);
    return {
      access_token: this.signAccessToken(user),
      refresh_token,
      user: this.toProfile(user),
    };
  }

  private signAccessToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
  }

  private async issueRefreshToken(
    userId: string,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<string> {
    const token = randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId,
        token,
        expiresAt,
        revokedAt: null,
        replacedByToken: null,
        userAgent: meta.userAgent ?? null,
        ip: meta.ip ?? null,
      } as any),
    );
    return token;
  }

  async refresh(
    presentedToken: string,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<AuthResponseDto> {
    const record = await this.refreshTokenRepo.findOne({ where: { token: presentedToken } });
    if (!record) throw new UnauthorizedException('Refresh token invalide');

    // Reuse detection: token already revoked → likely stolen, kill the whole family
    if (record.revokedAt) {
      await this.revokeAllForUser(record.userId);
      throw new UnauthorizedException('Refresh token déjà utilisé — toutes les sessions ont été révoquées');
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expiré');
    }

    const user = await this.usersService.findOne(record.userId);
    if (!user.isActive) throw new UnauthorizedException('Compte désactivé');

    // Rotate
    const next = await this.issueRefreshToken(user.id, meta);
    record.revokedAt = new Date();
    record.replacedByToken = next;
    await this.refreshTokenRepo.save(record);

    return {
      access_token: this.signAccessToken(user),
      refresh_token: next,
      user: this.toProfile(user),
    };
  }

  async logout(presentedToken: string): Promise<void> {
    const record = await this.refreshTokenRepo.findOne({ where: { token: presentedToken } });
    if (record && !record.revokedAt) {
      record.revokedAt = new Date();
      await this.refreshTokenRepo.save(record);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.revokeAllForUser(userId);
  }

  private async revokeAllForUser(userId: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, revokedAt: undefined as any },
      { revokedAt: new Date() },
    );
  }

  // ── Register ────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    if (this.captcha?.isEnabled) {
      await this.captcha.verify(dto.captchaToken);
    }
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ConflictException('Cet email est déjà utilisé');
    const user = await this.usersService.create(dto);
    // Fire-and-forget verification email — don't block registration on it
    this.sendVerificationEmail(user).catch(() => undefined);
    return this.login(user);
  }

  async getMe(userId: string): Promise<UserProfileDto> {
    const user = await this.usersService.findOne(userId);
    return this.toProfile(user);
  }

  // ── Google OAuth ────────────────────────────────────────────

  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    fullName: string;
  }): Promise<User> {
    const byGoogleId = await this.usersService.findByGoogleId(profile.googleId);
    if (byGoogleId) return byGoogleId;

    const byEmail = await this.usersService.findByEmail(profile.email);
    if (byEmail) {
      // Existing local account → link Google id, mark verified (Google verified the email)
      const linked = await this.usersService.linkGoogleAccount(byEmail.id, profile.googleId);
      if (!linked.emailVerifiedAt) {
        linked.emailVerifiedAt = new Date();
        await this.usersService.save(linked);
      }
      return linked;
    }

    // New Google user — auto-verified by Google
    const created = await this.usersService.createGoogleUser({
      email: profile.email,
      fullName: profile.fullName,
      googleId: profile.googleId,
    });
    created.emailVerifiedAt = new Date();
    return this.usersService.save(created);
  }

  // ── Password reset ──────────────────────────────────────────

  async forgotPassword(email: string, captchaToken?: string): Promise<void> {
    if (this.captcha?.isEnabled) {
      await this.captcha.verify(captchaToken);
    }
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) return;

    await this.resetTokenRepo.update(
      { userId: user.id, usedAt: undefined as any },
      { usedAt: new Date() },
    );

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.resetTokenRepo.save(
      this.resetTokenRepo.create({ userId: user.id, token, expiresAt, usedAt: null }),
    );

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
    await this.emailService.sendPasswordReset(
      user.email,
      user.fullName,
      `${frontendUrl}/reset-password?token=${token}`,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await this.resetTokenRepo.findOne({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré');
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(record.userId, hashed);

    record.usedAt = new Date();
    await this.resetTokenRepo.save(record);
  }

  async pruneExpiredResetTokens(): Promise<number> {
    const { affected } = await this.resetTokenRepo.delete({ expiresAt: LessThan(new Date()) });
    return affected ?? 0;
  }

  // ── Email verification ──────────────────────────────────────

  async sendVerificationEmail(user: User): Promise<void> {
    if (user.emailVerifiedAt) return;

    // Invalidate previous pending tokens
    await this.verifyTokenRepo.update(
      { userId: user.id, usedAt: undefined as any },
      { usedAt: new Date() },
    );

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
    await this.verifyTokenRepo.save(
      this.verifyTokenRepo.create({ userId: user.id, token, expiresAt, usedAt: null }),
    );

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
    await this.emailService.sendEmailVerification(
      user.email,
      user.fullName,
      `${frontendUrl}/verify-email?token=${token}`,
    );
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await this.verifyTokenRepo.findOne({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('Lien de vérification invalide ou expiré');
    }

    const user = await this.usersService.findOne(record.userId);
    if (!user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date();
      await this.usersService.save(user);
    }

    record.usedAt = new Date();
    await this.verifyTokenRepo.save(record);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive || user.emailVerifiedAt) return;
    await this.sendVerificationEmail(user);
  }

  // ── Profile mapper ─────────────────────────────────────────

  private toProfile(user: User): UserProfileDto {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone ?? undefined,
      createdAt: user.createdAt,
      emailVerified: !!user.emailVerifiedAt,
    };
  }
}
