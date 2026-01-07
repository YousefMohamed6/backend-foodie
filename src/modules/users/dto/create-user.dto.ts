import { DevicePlatform, UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;

  @IsOptional()
  @IsString()
  profilePictureURL?: string;

  @IsOptional()
  @IsEnum(DevicePlatform)
  devicePlatform?: DevicePlatform;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
}
