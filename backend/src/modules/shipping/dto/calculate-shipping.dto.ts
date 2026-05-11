import { IsString, IsNumber, Min, IsArray, IsOptional, ValidateNested, IsUUID, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateShippingItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CalculateShippingDto {
  @ApiProperty({ example: 'France' })
  @IsString()
  country: string;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ type: [CalculateShippingItemDto], required: false, description: 'Cart items, used to compute weight-based pricing' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CalculateShippingItemDto)
  items?: CalculateShippingItemDto[];
}
