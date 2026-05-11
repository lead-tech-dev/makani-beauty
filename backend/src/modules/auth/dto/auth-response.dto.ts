import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

export class UserProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() fullName: string;
  @ApiProperty() email: string;
  @ApiProperty({ enum: UserRole }) role: UserRole;
  @ApiProperty({ required: false }) phone?: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ default: false }) emailVerified: boolean;
}

export class AuthResponseDto {
  @ApiProperty() access_token: string;
  @ApiProperty() refresh_token: string;
  @ApiProperty({ type: UserProfileDto }) user: UserProfileDto;
}
