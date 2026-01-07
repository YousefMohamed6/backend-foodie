import { ApiProperty } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SocialLoginDto {
  @ApiProperty({
    enum: ['google', 'apple'],
    description: 'Social login provider',
  })
  @IsString()
  @IsNotEmpty()
  provider: 'google' | 'apple';

  @ApiProperty({
    description:
      'ID token from Google or Identity token from Apple. This token will be verified server-side.',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @ApiProperty({
    required: false,
    description:
      'Optional: User first name (only needed if not available in token)',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    required: false,
    description:
      'Optional: User last name (only needed if not available in token)',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    required: false,
    description: 'Device ID for token binding',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiProperty({
    required: false,
    enum: DevicePlatform,
    description: 'Device platform (android, ios, web)',
  })
  @IsOptional()
  @IsEnum(DevicePlatform)
  devicePlatform?: DevicePlatform;
}
