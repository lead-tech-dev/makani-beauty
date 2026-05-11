import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveReturnDto {
  @ApiProperty({ required: false, description: 'Override refund amount; defaults to sum of returned items' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  refundAmount?: number;
}

export class RejectReturnDto {
  @ApiProperty({ minLength: 3, maxLength: 1000 })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  reason: string;
}
