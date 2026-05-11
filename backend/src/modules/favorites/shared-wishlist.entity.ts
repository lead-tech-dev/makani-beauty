import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity('shared_wishlists')
export class SharedWishlist extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ApiProperty({ description: 'Public token used in the share URL' })
  @Index({ unique: true })
  @Column()
  token: string;

  @ApiProperty({ required: false, description: 'Optional note shown on the public page' })
  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ApiProperty({ default: 0, description: 'Number of times the public URL was visited' })
  @Column({ default: 0 })
  viewCount: number;
}
