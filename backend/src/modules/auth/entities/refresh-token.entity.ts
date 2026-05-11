import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @Index()
  @Column()
  userId: string;

  // Stored as plain string. Acceptable trade-off for now since we rotate
  // on every refresh and revoke on logout. Hashing would only matter if
  // the table itself leaked.
  @Index({ unique: true })
  @Column()
  token: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  // When this token is rotated, points to its replacement (audit trail)
  @Column({ type: 'varchar', nullable: true })
  replacedByToken: string | null;

  // Optional metadata for security audit
  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', nullable: true })
  ip: string | null;
}
