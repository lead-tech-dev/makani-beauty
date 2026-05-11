import { IsUUID, IsArray, IsIn, IsOptional, IsString, IsInt, IsEnum, Min, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FulfillmentMethod } from '../../../common/enums/fulfillment-method.enum';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsUUID()
  productId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ required: false, description: 'Variant ID when product has variants (clothing, hair, etc.)' })
  @IsOptional()
  @IsUUID()
  variantId?: string;
}

export class RelayPointSnapshotDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  line1: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  line2?: string;

  @ApiProperty()
  @IsString()
  postalCode: string;

  @ApiProperty()
  @IsString()
  city: string;

  @ApiProperty()
  @IsString()
  country: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  hours?: string;
}

export class CreateOrderDto {
  @ApiProperty({ enum: FulfillmentMethod, default: FulfillmentMethod.DELIVERY, required: false })
  @IsOptional()
  @IsEnum(FulfillmentMethod)
  fulfillmentMethod?: FulfillmentMethod;

  @ApiProperty({ enum: ['standard', 'express'], default: 'standard', required: false })
  @IsOptional()
  @IsIn(['standard', 'express'])
  shippingSpeed?: 'standard' | 'express';

  @ApiProperty({ required: false, description: 'Required when fulfillmentMethod=delivery (home delivery)' })
  @ValidateIf((o) => o.fulfillmentMethod === FulfillmentMethod.DELIVERY || o.fulfillmentMethod === undefined)
  @IsUUID()
  addressId: string;

  @ApiProperty({ required: false, description: 'Required when fulfillmentMethod=relay' })
  @ValidateIf((o) => o.fulfillmentMethod === FulfillmentMethod.RELAY)
  @ValidateNested()
  @Type(() => RelayPointSnapshotDto)
  relayPoint?: RelayPointSnapshotDto;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, example: 'WELCOME5' })
  @IsOptional()
  @IsString()
  promoCode?: string;
}
