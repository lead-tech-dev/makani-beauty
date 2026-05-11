import { IsInt, IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTierDto {
  @ApiProperty({ example: 0 })
  @IsInt()
  @Min(0)
  minWeightGrams: number;

  @ApiProperty({ example: 500, required: false, description: 'null for "and above"' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsInt()
  @Min(1)
  maxWeightGrams: number | null;

  @ApiProperty({ example: 4.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}

export class UpdateTierDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  minWeightGrams?: number;

  @ApiProperty({ required: false, description: 'null for "and above"' })
  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsInt()
  @Min(1)
  maxWeightGrams?: number | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;
}
