import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class FindNearestVendorsDto {
    @ApiProperty({ description: 'Latitude coordinate', example: 30.0444 })
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number;

    @ApiProperty({ description: 'Longitude coordinate', example: 31.2357 })
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number;

    @ApiPropertyOptional({ description: 'Search radius in kilometers', example: 10 })
    @Type(() => Number)
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    radius?: number;

    @ApiPropertyOptional({ description: 'Filter by category ID' })
    @IsOptional()
    @IsUUID()
    categoryId?: string;

    @ApiPropertyOptional({ description: 'Filter by dine-in availability' })
    @Type(() => Boolean)
    @IsOptional()
    @IsBoolean()
    isDining?: boolean;
}
