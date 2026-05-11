import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { DeletionRequest } from './deletion-request.entity';
import { User } from '../users/user.entity';
import { Address } from '../addresses/address.entity';
import { Favorite } from '../favorites/favorite.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';
import { EmailService } from '../email/email.service';

const GRACE_PERIOD_DAYS = 7;

@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    @InjectRepository(DeletionRequest) private readonly requests: Repository<DeletionRequest>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Address) private readonly addresses: Repository<Address>,
    @InjectRepository(Favorite) private readonly favorites: Repository<Favorite>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
    @InjectRepository(EmailVerificationToken) private readonly evTokens: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken) private readonly prTokens: Repository<PasswordResetToken>,
    private readonly emailService: EmailService,
    private readonly dataSource: DataSource,
  ) {}

  // ── User-initiated flow ────────────────────────────────────

  async getActiveRequest(userId: string): Promise<DeletionRequest | null> {
    return this.requests.findOne({
      where: { userId, status: 'pending' },
      order: { createdAt: 'DESC' },
    });
  }

  async createRequest(userId: string, reason: string | null): Promise<DeletionRequest> {
    const existing = await this.getActiveRequest(userId);
    if (existing) {
      throw new BadRequestException('Une demande de suppression est déjà en cours');
    }

    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const now = new Date();
    const scheduled = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    const req = await this.requests.save(
      this.requests.create({
        userId,
        requestedAt: now,
        scheduledDeletionAt: scheduled,
        status: 'pending',
        reason,
      }),
    );

    await this.emailService.sendAccountDeletionRequested(user, scheduled).catch((e) => {
      this.logger.warn(`Failed to send deletion-request email to ${user.email}: ${e.message}`);
    });

    return req;
  }

  async cancelRequest(userId: string): Promise<DeletionRequest> {
    const req = await this.getActiveRequest(userId);
    if (!req) throw new NotFoundException('Aucune demande active à annuler');
    req.status = 'cancelled';
    req.cancelledAt = new Date();
    return this.requests.save(req);
  }

  // ── Cron + admin ──────────────────────────────────────────

  async listAllRequests(): Promise<DeletionRequest[]> {
    return this.requests.find({
      relations: ['user'],
      order: { requestedAt: 'DESC' },
      take: 200,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: 'Europe/Paris' })
  async runScheduledDeletions(): Promise<void> {
    const due = await this.requests.find({
      where: {
        status: 'pending',
        scheduledDeletionAt: LessThanOrEqual(new Date()),
      },
    });

    if (due.length === 0) return;
    this.logger.log(`Anonymizing ${due.length} account(s) past grace period`);

    for (const req of due) {
      try {
        await this.executeDeletion(req);
      } catch (err: any) {
        this.logger.error(`Failed to anonymize user ${req.userId}: ${err.message}`);
      }
    }
  }

  private async executeDeletion(req: DeletionRequest): Promise<void> {
    const user = await this.users.findOne({ where: { id: req.userId } });
    if (!user) {
      this.logger.warn(`User ${req.userId} no longer exists; marking request executed`);
      req.status = 'executed';
      req.executedAt = new Date();
      await this.requests.save(req);
      return;
    }

    const originalEmail = user.email;
    const originalName = user.fullName;

    await this.dataSource.transaction(async (tx) => {
      // 1. Anonymize personal fields on the user row (kept for orders/invoices linkage)
      const shortId = uuid().split('-')[0];
      user.email = `deleted-${shortId}@anonymized.local`;
      user.fullName = 'Utilisateur supprimé';
      user.phone = null as any;
      user.googleId = null as any;
      user.password = await bcrypt.hash(uuid(), 12); // unusable
      user.isActive = false;
      user.emailVerifiedAt = null;
      await tx.getRepository(User).save(user);

      // 2. Hard-delete data with no legal retention requirement
      await tx.getRepository(Address).delete({ userId: user.id });
      await tx.getRepository(Favorite).delete({ userId: user.id });
      await tx.getRepository(RefreshToken).delete({ userId: user.id });
      await tx.getRepository(EmailVerificationToken).delete({ userId: user.id });
      await tx.getRepository(PasswordResetToken).delete({ userId: user.id });

      // 3. Mark request executed
      req.status = 'executed';
      req.executedAt = new Date();
      await tx.getRepository(DeletionRequest).save(req);
    });

    // Notify the user one last time using the snapshot of their email
    await this.emailService
      .sendAccountDeletionExecuted({ id: user.id, email: originalEmail, fullName: originalName } as User)
      .catch((e) => {
        this.logger.warn(`Failed to send deletion-executed email: ${e.message}`);
      });

    this.logger.log(`Account anonymized: ${originalEmail} → ${user.email}`);
  }
}
