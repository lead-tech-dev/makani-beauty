import { Entity, Column, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { PromoCodeType } from '../../common/enums/promo-code-type.enum';

@Entity('promo_codes')
export class PromoCode extends BaseEntity {
  @ApiProperty({ example: 'WELCOME5' })
  @Index({ unique: true })
  @Column()
  code: string;

  @ApiProperty({ enum: PromoCodeType })
  @Column({ type: 'enum', enum: PromoCodeType })
  type: PromoCodeType;

  @ApiProperty({ description: 'Percentage 0-100 OR fixed amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @ApiProperty({ required: false, default: 0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrderAmount: number;

  @ApiProperty({ required: false, description: 'Total uses cap (null = unlimited)' })
  @Column({ type: 'int', nullable: true })
  maxUses: number | null;

  @ApiProperty({ default: 0 })
  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  validFrom: Date | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', nullable: true })
  description: string | null;
}
