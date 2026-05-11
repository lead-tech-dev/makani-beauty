import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('categories')
export class Category extends BaseEntity {
  @ApiProperty({ example: 'Soins visage' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ example: 'soins-visage' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  imageUrl: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;
}
