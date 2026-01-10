import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform, UserRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { normalizePhoneNumber } from '../../../common/utils/phone.utils';

export class RegisterDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.CUSTOMER })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => normalizePhoneNumber(value))
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fcmToken?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  profilePictureURL?: string;

  @ApiPropertyOptional({ enum: DevicePlatform })
  @IsEnum(DevicePlatform)
  @IsOptional()
  devicePlatform?: DevicePlatform;

  @ApiPropertyOptional({
    enum: ['email', 'google', 'apple', 'phone'],
    description: 'Authentication provider',
  })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiPropertyOptional({
    description: 'Referral code of the user who referred this new user',
  })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zoneId?: string;
}
