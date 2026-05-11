import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Crème hydratante Aloe Vera' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'creme-hydratante-aloe-vera' })
  @IsString()
  slug: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 24.99 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  salePrice?: number;

  @ApiProperty({ default: '€', required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageSrcset?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageLqip?: string | null;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ default: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock?: number;

  @ApiProperty({ default: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stockAlert?: number;

  @ApiProperty({ default: 0, minimum: 0, maximum: 5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiProperty({ default: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  reviewCount?: number;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  ingredients?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  volume?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  hairType?: string[] | null;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  skinType?: string[] | null;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  keyIngredients?: string[] | null;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  certifications?: string[] | null;

  @ApiProperty({ default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiProperty({ default: false, required: false, description: 'VIP-only product (Or tier)' })
  @IsOptional()
  @IsBoolean()
  vipOnly?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  brandId?: string;
}
