import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';

export type DeletionStatus = 'pending' | 'cancelled' | 'executed';

@Entity('deletion_requests')
@Index(['userId', 'status'])
export class DeletionRequest extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty()
  @Column()
  userId: string;

  @ApiProperty({ description: 'When the user submitted the request' })
  @Column({ type: 'timestamptz' })
  requestedAt: Date;

  @ApiProperty({ description: 'When anonymization will run (requestedAt + 7 days)' })
  @Column({ type: 'timestamptz' })
  scheduledDeletionAt: Date;

  @ApiProperty({ enum: ['pending', 'cancelled', 'executed'] })
  @Column({ type: 'varchar', default: 'pending' })
  status: DeletionStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  executedAt: Date | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;
}
