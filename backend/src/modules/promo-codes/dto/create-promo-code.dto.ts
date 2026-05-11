import {
  IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsInt, Min, Max, IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PromoCodeType } from '../../../common/enums/promo-code-type.enum';

export class CreatePromoCodeDto {
  @ApiProperty({ example: 'WELCOME5' })
  @IsString()
  code: string;

  @ApiProperty({ enum: PromoCodeType })
  @IsEnum(PromoCodeType)
  type: PromoCodeType;

  @ApiProperty({ description: 'Percentage (1-100) or fixed amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10000)
  value: number;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
