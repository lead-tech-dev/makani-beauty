import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateSubProcessorDto {
  @ApiProperty()
  @IsString() @MinLength(2) @MaxLength(120)
  name: string;

  @ApiProperty()
  @IsString() @MinLength(3) @MaxLength(200)
  purpose: string;

  @ApiProperty()
  @IsString() @MinLength(3) @MaxLength(500)
  dataTransmitted: string;

  @ApiProperty()
  @IsString() @MinLength(2) @MaxLength(80)
  country: string;

  @ApiProperty()
  @IsString() @MinLength(3) @MaxLength(300)
  safeguards: string;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  website?: string | null;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional() @IsInt()
  displayOrder?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export class UpdateSubProcessorDto extends PartialType(CreateSubProcessorDto) {}
