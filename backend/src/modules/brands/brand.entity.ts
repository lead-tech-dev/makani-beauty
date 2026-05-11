import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('brands')
export class Brand extends BaseEntity {
  @ApiProperty({ example: 'Lush' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ example: 'lush' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  logoUrl: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  website: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;
}
