import { IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefundOrderDto {
  @ApiProperty({ required: false, description: 'Partial refund amount (omit for full refund)' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiProperty({ required: false, description: 'Internal reason — logged, not sent to provider' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
