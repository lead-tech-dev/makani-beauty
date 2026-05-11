import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubscribeDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, description: 'Source tag: "footer", "exit-intent", "checkout", etc.' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;
}
