import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, Min, Max, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductSortField {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NAME_ASC = 'name_asc',
  POPULARITY = 'popularity',
  RATING = 'rating',
  DISCOUNT = 'discount',
}

const splitCsv = ({ value }: { value: any }) => {
  if (Array.isArray(value)) return value.flatMap((v) => String(v).split(',')).map((s) => s.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return value;
};

export class ProductQueryDto {
  @ApiPropertyOptional({ description: 'Search in name and description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ type: [String], description: 'Hair types (comma-separated or repeated): 3A, 3B, 3C, 4A, 4B, 4C' })
  @IsOptional()
  @Transform(splitCsv)
  @IsArray()
  hairType?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Skin types (comma-separated or repeated): sec, gras, mixte, sensible, normal' })
  @IsOptional()
  @Transform(splitCsv)
  @IsArray()
  skinType?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(splitCsv)
  @IsArray()
  ingredients?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Certifications: bio, vegan, cruelty-free, etc.' })
  @IsOptional()
  @Transform(splitCsv)
  @IsArray()
  certifications?: string[];

  @ApiPropertyOptional({ enum: ProductSortField, default: ProductSortField.NEWEST })
  @IsOptional()
  @IsEnum(ProductSortField)
  sort?: ProductSortField = ProductSortField.NEWEST;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 20;
}
