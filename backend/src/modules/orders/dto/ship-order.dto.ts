import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ShipOrderDto {
  @ApiProperty({ enum: ['colissimo'] })
  @IsIn(['colissimo'])
  carrier: 'colissimo';

  @ApiProperty({ required: false, description: 'Override the auto-computed weight (grams)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  weightOverrideGrams?: number;
}
