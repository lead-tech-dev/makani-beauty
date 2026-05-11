import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ValidatePromoCodeDto {
  @ApiProperty({ example: 'WELCOME5' })
  @IsString()
  code: string;

  @ApiProperty({ example: 50 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subtotal: number;
}
