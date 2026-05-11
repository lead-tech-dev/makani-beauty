import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('addresses')
export class Address extends BaseEntity {
  @ApiProperty({ example: 'Marie Dupont' })
  @Column()
  fullName: string;

  @ApiProperty({ example: '12 rue de la Paix' })
  @Column()
  line1: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  line2: string;

  @ApiProperty({ example: 'Paris' })
  @Column()
  city: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  state: string;

  @ApiProperty({ example: '75001' })
  @Column()
  postalCode: string;

  @ApiProperty({ example: 'France' })
  @Column()
  country: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ default: false })
  @Column({ default: false })
  isDefault: boolean;

  @Column()
  userId: string;
}
