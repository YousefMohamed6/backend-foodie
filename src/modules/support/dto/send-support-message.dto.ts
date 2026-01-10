import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupportMessageType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendSupportMessageDto {
    @ApiPropertyOptional({
        description: 'Text message content',
        maxLength: 5000,
    })
    @IsString()
    @IsOptional()
    @MaxLength(5000)
    message?: string;

    @ApiProperty({
        description: 'Message type',
        enum: SupportMessageType,
        example: SupportMessageType.TEXT,
    })
    @IsEnum(SupportMessageType)
    type: SupportMessageType;
}
