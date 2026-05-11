import { Entity, Column, BeforeInsert, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ example: 'Marie Dupont' })
  @Column()
  fullName: string;

  @ApiProperty({ example: 'marie@example.com' })
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Index({ unique: true, where: '"googleId" IS NOT NULL' })
  @Column({ nullable: true })
  googleId: string;

  @ApiProperty({ enum: UserRole, default: UserRole.CLIENT })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.CLIENT })
  role: UserRole;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  // ── Email verification ─────────────────────────────────────
  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;

  // ── Brute-force protection ─────────────────────────────────
  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }
}
