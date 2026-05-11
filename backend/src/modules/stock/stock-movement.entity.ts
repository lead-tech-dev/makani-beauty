import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';
import { StockMovementType } from '../../common/enums/stock-movement-type.enum';
import { Product } from '../products/product.entity';

@Entity('stock_movements')
export class StockMovement extends BaseEntity {
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column()
  productId: string;

  @ApiProperty({ enum: StockMovementType })
  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @ApiProperty({ description: 'Positive = add, Negative = remove' })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ description: 'Stock level after this movement' })
  @Column({ type: 'int' })
  stockAfter: number;

  @ApiProperty({ required: false, example: 'Réception fournisseur' })
  @Column({ nullable: true })
  reason: string;
}
