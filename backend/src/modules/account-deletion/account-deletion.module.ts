import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeletionRequest } from './deletion-request.entity';
import { User } from '../users/user.entity';
import { Address } from '../addresses/address.entity';
import { Favorite } from '../favorites/favorite.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { EmailVerificationToken } from '../auth/entities/email-verification-token.entity';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity';
import { AccountDeletionService } from './account-deletion.service';
import { AccountDeletionController } from './account-deletion.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeletionRequest,
      User,
      Address,
      Favorite,
      RefreshToken,
      EmailVerificationToken,
      PasswordResetToken,
    ]),
    EmailModule,
  ],
  providers: [AccountDeletionService],
  controllers: [AccountDeletionController],
})
export class AccountDeletionModule {}
