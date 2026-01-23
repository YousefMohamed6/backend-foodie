import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVendorTypeDto {
    @ApiProperty({ description: 'English name of the vendor type' })
    @IsNotEmpty()
    @IsString()
    englishName: string;

    @ApiProperty({ description: 'Arabic name of the vendor type' })
    @IsNotEmpty()
    @IsString()
    arabicName: string;

    @ApiPropertyOptional({ description: 'Photo URL of the vendor type' })
    @IsOptional()
    @IsString()
    photo?: string;

    @ApiPropertyOptional({ description: 'Whether the vendor type is active', default: true })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({ description: 'Whether to show on homepage', default: false })
    @IsOptional()
    @IsBoolean()
    showOnHome?: boolean;
}
