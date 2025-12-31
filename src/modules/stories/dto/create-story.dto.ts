import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateStoryDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    mediaUrl: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    mediaType: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    duration?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    videoThumbnail?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
