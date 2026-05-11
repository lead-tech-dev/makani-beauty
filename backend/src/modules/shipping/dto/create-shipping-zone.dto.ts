import { IsString, IsArray, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShippingZoneDto {
  @ApiProperty({ example: 'France métropolitaine' })
  @IsString()
  name: string;

  @ApiProperty({ type: [String], example: ['France'] })
  @IsArray()
  @IsString({ each: true })
  countries: string[];

  @ApiProperty({ example: 5.99 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseRate: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  freeShippingThreshold?: number;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
