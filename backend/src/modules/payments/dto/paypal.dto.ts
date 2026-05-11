import { IsUUID, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaypalOrderDto {
  @ApiProperty()
  @IsUUID()
  orderId: string;
}

export class CapturePaypalOrderDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  paypalOrderId: string;
}
