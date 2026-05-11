import { Entity, Column, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';
import { FulfillmentMethod } from '../../common/enums/fulfillment-method.enum';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order extends BaseEntity {
  @ApiProperty({ example: 'FB-2024-123456' })
  @Column({ unique: true })
  orderNumber: string;

  @Column()
  userId: string;

  @ApiProperty({ enum: FulfillmentMethod, default: FulfillmentMethod.DELIVERY })
  @Column({ type: 'enum', enum: FulfillmentMethod, default: FulfillmentMethod.DELIVERY })
  fulfillmentMethod: FulfillmentMethod;

  @ApiProperty({ enum: ['standard', 'express'], default: 'standard' })
  @Column({ type: 'varchar', default: 'standard' })
  shippingSpeed: 'standard' | 'express';

  @Column({ type: 'varchar', nullable: true })
  shippingAddressId: string | null;

  @ApiProperty({ description: 'Snapshot of the address at order time' })
  @Column({ type: 'jsonb' })
  shippingSnapshot: Record<string, any>;

  @ApiProperty({ enum: OrderStatus, default: OrderStatus.PENDING })
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Index({ unique: true, where: '"stripePaymentIntentId" IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true })
  stripePaymentIntentId: string | null;

  @Index({ unique: true, where: '"paypalOrderId" IS NOT NULL' })
  @Column({ type: 'varchar', nullable: true })
  paypalOrderId: string | null;

  @ApiProperty({ required: false, enum: ['stripe', 'paypal'] })
  @Column({ type: 'varchar', nullable: true })
  paymentProvider: 'stripe' | 'paypal' | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @ApiProperty({ default: 0, description: 'Amount already refunded (sum of all refunds)' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  @ApiProperty({ type: () => [OrderItem] })
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingFee: number;

  @ApiProperty({ default: 0, description: 'VAT % rate (e.g. 20.00 for France)' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @ApiProperty({ default: 0, description: 'VAT amount embedded in TTC total' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', nullable: true })
  discountCode: string | null;

  @ApiProperty({ default: 0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @ApiProperty({ default: '€' })
  @Column({ default: '€' })
  currency: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty({ required: false, description: 'Carrier name (e.g. colissimo)' })
  @Column({ type: 'varchar', nullable: true })
  carrier: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', nullable: true })
  trackingNumber: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', nullable: true })
  trackingUrl: string | null;

  @ApiProperty({ required: false, description: 'Public URL to the shipping label PDF' })
  @Column({ type: 'varchar', nullable: true })
  labelUrl: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  shippedAt: Date;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date;

  @ApiProperty({ required: false, description: 'Timestamp when the post-delivery review request email was sent' })
  @Column({ type: 'timestamptz', nullable: true })
  reviewRequestSentAt: Date | null;

  @ApiProperty({ required: false, description: 'Timestamp when the abandoned-cart relance email was sent (1 max)' })
  @Column({ type: 'timestamptz', nullable: true })
  abandonedCartEmailSentAt: Date | null;

  @ApiProperty({ required: false, description: 'Timestamp when the J+30 replenishment email was sent (1 max)' })
  @Column({ type: 'timestamptz', nullable: true })
  replenishmentEmailSentAt: Date | null;
}
