import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform, UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyFirebaseOtpDto {
    @ApiProperty({
        description: 'Firebase ID token received after successful phone verification',
        example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsString()
    @IsNotEmpty()
    idToken: string;

    @ApiProperty({
        description: 'First name for new user registration',
    })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({
        description: 'Last name for new user registration',
    })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({
        description: 'Email address for new user registration',
        example: 'user@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiPropertyOptional({
        description: 'Role for new user (CUSTOMER, DRIVER, VENDOR, or MANAGER)',
        enum: [UserRole.CUSTOMER, UserRole.DRIVER, UserRole.VENDOR, UserRole.MANAGER],
        default: UserRole.CUSTOMER,
    })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @ApiPropertyOptional({
        description: 'Device ID for token binding',
    })
    @IsString()
    @IsOptional()
    deviceId?: string;

    @ApiPropertyOptional({
        description: 'FCM token for push notifications',
    })
    @IsString()
    @IsOptional()
    fcmToken?: string;

    @ApiPropertyOptional({
        description: 'Device platform',
        enum: DevicePlatform,
    })
    @IsEnum(DevicePlatform)
    @IsOptional()
    devicePlatform?: DevicePlatform;

    @ApiPropertyOptional({
        description: 'Referral code if user was referred',
    })
    @IsString()
    @IsOptional()
    referralCode?: string;

    @ApiPropertyOptional({
        description: 'Zone ID (Mandatory for roles: DRIVER, VENDOR, MANAGER)',
    })
    @IsString()
    @IsOptional()
    zoneId?: string;
}
