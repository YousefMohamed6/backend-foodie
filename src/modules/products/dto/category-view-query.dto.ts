import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CategoryViewQueryDto {
    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsInt()
    @Type(() => Number)
    @Min(1)
    page?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsInt()
    @Type(() => Number)
    @Min(1)
    limit?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;
}
