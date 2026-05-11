import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('email_verification_tokens')
export class EmailVerificationToken extends BaseEntity {
  @Index()
  @Column()
  userId: string;

  @Index({ unique: true })
  @Column()
  token: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;
}
