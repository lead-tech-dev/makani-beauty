import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { Order } from '../orders/order.entity';

export type ReturnStatus = 'pending' | 'approved' | 'rejected';

export interface ReturnedItem {
  orderItemId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

@Entity('return_requests')
@Index(['orderId'])
@Index(['userId', 'status'])
export class ReturnRequest extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty({ enum: ['pending', 'approved', 'rejected'] })
  @Column({ type: 'varchar', default: 'pending' })
  status: ReturnStatus;

  @ApiProperty()
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ description: 'Snapshot of returned items (orderItemId, qty, unit price at request time)' })
  @Column({ type: 'jsonb' })
  items: ReturnedItem[];

  @ApiProperty({ required: false })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number | null;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  rejectReason: string | null;

  @ApiProperty({ required: false })
  @Column({ type: 'timestamptz', nullable: true })
  processedAt: Date | null;

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  processedByUserId: string | null;
}
