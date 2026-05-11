import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { ShippingTier } from './shipping-tier.entity';

@Entity('shipping_zones')
export class ShippingZone extends BaseEntity {
  @ApiProperty({ example: 'France métropolitaine' })
  @Column()
  name: string;

  @ApiProperty({ type: [String], example: ['France'] })
  @Column({ type: 'simple-array' })
  countries: string[];

  @ApiProperty({ example: 5.99 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseRate: number;

  @ApiProperty({ required: false, default: 0, description: '0 = no free shipping' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  freeShippingThreshold: number;

  @ApiProperty({ example: 20, description: 'VAT % included in TTC prices' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @ApiProperty({ default: false, description: 'Catch-all fallback when no country matches' })
  @Column({ default: false })
  isDefault: boolean;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ type: () => [ShippingTier], description: 'Weight-based pricing tiers (overrides baseRate when present)' })
  @OneToMany(() => ShippingTier, (tier) => tier.shippingZone, { cascade: true, eager: true })
  tiers: ShippingTier[];
}
