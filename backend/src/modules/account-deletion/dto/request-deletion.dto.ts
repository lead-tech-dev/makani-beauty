import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestDeletionDto {
  @ApiProperty({ required: false, description: 'Optional reason given by the user (kept internally for product improvement, not anonymized)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
