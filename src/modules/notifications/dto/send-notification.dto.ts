import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class BilingualText {
    @ApiProperty({ example: 'Special Promotion' })
    @IsString()
    @IsNotEmpty()
    en: string;

    @ApiProperty({ example: 'عرض خاص' })
    @IsString()
    @IsNotEmpty()
    ar: string;
}

export class SendRoleNotificationDto {
    @ApiProperty({
        description: 'Target user role',
        enum: UserRole,
        enumName: 'UserRole',
        example: UserRole.CUSTOMER,
    })
    @IsEnum(UserRole)
    role: UserRole;

    @ApiProperty({
        description: 'Notification title in both languages',
        type: BilingualText,
    })
    @ValidateNested()
    @Type(() => BilingualText)
    title: BilingualText;

    @ApiProperty({
        description: 'Notification message in both languages',
        type: BilingualText,
    })
    @ValidateNested()
    @Type(() => BilingualText)
    message: BilingualText;

    @ApiProperty({
        description: 'Additional data to send with notification',
        required: false,
        example: { promoCode: 'SAVE20' },
    })
    @IsOptional()
    @IsObject()
    data?: Record<string, any>;
}

export class SendCustomNotificationDto {
    @ApiProperty({
        description: 'Array of user IDs to send notification to',
        example: ['uuid-1', 'uuid-2'],
    })
    @IsString({ each: true })
    @IsNotEmpty({ each: true })
    userIds: string[];

    @ApiProperty({
        description: 'Notification title in both languages',
        type: BilingualText,
    })
    @ValidateNested()
    @Type(() => BilingualText)
    title: BilingualText;

    @ApiProperty({
        description: 'Notification message in both languages',
        type: BilingualText,
    })
    @ValidateNested()
    @Type(() => BilingualText)
    message: BilingualText;

    @ApiProperty({
        description: 'Additional data to send with notification',
        required: false,
    })
    @IsOptional()
    @IsObject()
    data?: Record<string, any>;
}
