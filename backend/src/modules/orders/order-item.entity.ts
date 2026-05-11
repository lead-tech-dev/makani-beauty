import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('order_items')
export class OrderItem extends BaseEntity {
  @Column()
  orderId: string;

  @ApiProperty()
  @Column()
  productId: string;

  @ApiProperty()
  @Column()
  productName: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  productImageUrl: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty()
  @Column()
  quantity: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  // ── Variant snapshot (when product has variants — clothing, hair extensions) ──
  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  variantId: string | null;

  @ApiProperty({ required: false, description: 'Human-readable label like "Taille M / Noir"' })
  @Column({ type: 'varchar', nullable: true })
  variantLabel: string | null;

  // Back-reference (not eager, avoids circular load)
  @ManyToOne('Order', 'items')
  @JoinColumn({ name: 'orderId' })
  order: any;
}
