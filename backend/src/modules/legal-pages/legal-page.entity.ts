import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('legal_pages')
export class LegalPage extends BaseEntity {
  @ApiProperty({ example: 'cgv' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ example: 'Conditions Générales de Vente' })
  @Column()
  title: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  intro: string | null;

  @ApiProperty({ description: 'Markdown body content (sections delimited by ## headings)' })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ example: '2026-05-04' })
  @Column({ type: 'date' })
  lastUpdated: string;
}
