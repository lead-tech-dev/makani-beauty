import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { Order } from './order.entity';
import type { ShipmentStatus } from '../carriers/carrier.types';

/**
 * Append-only log of carrier-tracking events for an order.
 * Populated by the periodic poller (and later: by webhooks).
 */
@Entity('shipment_events')
@Index(['orderId', 'occurredAt'])
export class ShipmentEvent extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({ enum: ['pre_transit', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'unknown'] })
  @Column({ type: 'varchar' })
  status: ShipmentStatus;

  @ApiProperty()
  @Column({ type: 'varchar' })
  message: string;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  occurredAt: Date;
}
