import { IsOptional, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLegalPageDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  intro?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(20)
  body?: string;

  @ApiProperty({ required: false, example: '2026-05-04' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'lastUpdated must be in YYYY-MM-DD format' })
  lastUpdated?: string;
}
