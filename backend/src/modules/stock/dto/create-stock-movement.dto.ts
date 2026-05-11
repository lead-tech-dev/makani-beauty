import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StockMovementType } from '../../../common/enums/stock-movement-type.enum';

export class CreateStockMovementDto {
  @ApiProperty({ enum: StockMovementType, example: StockMovementType.IN })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({ example: 10, description: 'Positive = add, Negative = remove' })
  @IsInt()
  quantity: number;

  @ApiProperty({ required: false, example: 'Réception fournisseur' })
  @IsOptional()
  @IsString()
  reason?: string;
}
