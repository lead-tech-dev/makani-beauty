import { Column, Entity, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

export type SubscriberStatus = 'pending' | 'confirmed' | 'unsubscribed';

@Entity('newsletter_subscribers')
export class NewsletterSubscriber extends BaseEntity {
  @ApiProperty()
  @Index({ unique: true })
  @Column()
  email: string;

  @ApiProperty({ enum: ['pending', 'confirmed', 'unsubscribed'], default: 'pending' })
  @Column({ type: 'varchar', default: 'pending' })
  status: SubscriberStatus;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', nullable: true })
  source: string | null;

  @ApiProperty({ required: false, description: 'Promo code given as welcome gift (typically -5%)' })
  @Column({ type: 'varchar', nullable: true })
  welcomePromoCode: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', nullable: true })
  brevoContactId: string | null;

  @Index({ unique: true, where: '"confirmationToken" IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true })
  confirmationToken: string | null;

  @Index({ unique: true, where: '"unsubscribeToken" IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true })
  unsubscribeToken: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  unsubscribedAt: Date | null;
}
