import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'marie@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, description: 'hCaptcha token (required in production)' })
  @IsOptional()
  @IsString()
  captchaToken?: string;
}
