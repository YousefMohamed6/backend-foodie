import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform, UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

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
}
