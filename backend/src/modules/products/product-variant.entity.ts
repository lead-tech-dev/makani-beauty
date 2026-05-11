import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from './product.entity';

/**
 * Variant of a product (size, color, length, etc.).
 *
 * `attributes` is a flexible JSON map so we can describe both:
 *   - clothing : { size: "M", color: "noir" }
 *   - hair     : { length: "16″", texture: "deep-curl", color: "1B" }
 *
 * Stock is tracked per variant. Price/image overrides are optional —
 * fall back to the parent product's values if null.
 */
@Entity('product_variants')
@Index(['productId'])
export class ProductVariant extends BaseEntity {
  @ApiProperty()
  @Column()
  productId: string;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ApiProperty({ description: 'Free-form key/value (e.g. {size:"M",color:"noir"})' })
  @Column({ type: 'jsonb', default: {} })
  attributes: Record<string, string>;

  @ApiProperty({ default: 0 })
  @Column({ default: 0 })
  stock: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', nullable: true })
  sku: string | null;

  @ApiProperty({ required: false, description: 'Optional price override; falls back to product.price' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceOverride: number | null;

  @ApiProperty({ required: false, description: 'Optional image override; falls back to product.imageUrl' })
  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @ApiProperty({ default: 0 })
  @Column({ default: 0 })
  displayOrder: number;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;
}
