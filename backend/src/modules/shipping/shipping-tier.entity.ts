import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { ShippingZone } from './shipping-zone.entity';

/**
 * Weight-based pricing tier for a shipping zone.
 * Tiers are inclusive of `minWeightGrams` and exclusive of `maxWeightGrams`.
 * `maxWeightGrams = null` means "and above" (open-ended top tier).
 */
@Entity('shipping_tiers')
@Index(['shippingZoneId'])
export class ShippingTier extends BaseEntity {
  @Column({ type: 'uuid' })
  shippingZoneId: string;

  @ManyToOne(() => ShippingZone, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shippingZoneId' })
  shippingZone: ShippingZone;

  @ApiProperty({ example: 0, description: 'Inclusive lower bound, in grams' })
  @Column({ type: 'integer' })
  minWeightGrams: number;

  @ApiProperty({ example: 500, required: false, description: 'Exclusive upper bound, in grams. null = "and above"' })
  @Column({ type: 'integer', nullable: true })
  maxWeightGrams: number | null;

  @ApiProperty({ example: 4.99, description: 'Shipping price for this tier (TTC)' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;
}
