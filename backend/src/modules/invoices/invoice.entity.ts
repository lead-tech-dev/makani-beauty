import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { Order } from '../orders/order.entity';

/**
 * Invoice tied to a paid order. Sequence is allocated atomically per year so
 * displayed numbers look like "F-2026-0001" without gaps within a year.
 */
@Entity('invoices')
@Index(['year', 'sequence'], { unique: true })
@Index(['orderId'], { unique: true })
export class Invoice extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({ example: 2026 })
  @Column({ type: 'integer' })
  year: number;

  @ApiProperty({ example: 42 })
  @Column({ type: 'integer' })
  sequence: number;

  @ApiProperty({ example: 'F-2026-0042' })
  @Column({ type: 'varchar', unique: true })
  number: string;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  issuedAt: Date;

  @ApiProperty({ description: 'Server filesystem path (private — served via authenticated endpoint).' })
  @Column({ type: 'varchar' })
  pdfPath: string;
}
