import { Entity, Column, Unique, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('favorites')
@Unique(['userId', 'productId'])
@Index(['userId'])
export class Favorite extends BaseEntity {
  @Column()
  userId: string;

  @Column()
  productId: string;
}
