import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('sub_processors')
export class SubProcessor extends BaseEntity {
  @ApiProperty({ example: 'Stripe' })
  @Column()
  name: string;

  @ApiProperty({ example: 'Traitement des paiements par carte' })
  @Column()
  purpose: string;

  @ApiProperty({ example: 'Email, identité, données de transaction (4 derniers chiffres CB)' })
  @Column({ type: 'text' })
  dataTransmitted: string;

  @ApiProperty({ example: 'États-Unis' })
  @Column()
  country: string;

  @ApiProperty({ example: 'Clauses contractuelles types · Data Privacy Framework' })
  @Column({ type: 'text' })
  safeguards: string;

  @ApiProperty({ required: false })
  @Column({ type: 'varchar', nullable: true })
  website: string | null;

  @ApiProperty({ default: 0, description: 'Display order — lower first' })
  @Column({ default: 0 })
  displayOrder: number;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;
}
