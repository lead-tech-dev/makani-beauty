import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * Per-year sequence counter for invoice numbering.
 * Allocation is done via INSERT ... ON CONFLICT DO UPDATE RETURNING, which
 * is atomic and avoids the "FOR UPDATE with aggregate" Postgres restriction.
 */
@Entity('invoice_counters')
export class InvoiceCounter {
  @PrimaryColumn({ type: 'integer' })
  year: number;

  @Column({ type: 'integer', default: 0 })
  lastSequence: number;
}
