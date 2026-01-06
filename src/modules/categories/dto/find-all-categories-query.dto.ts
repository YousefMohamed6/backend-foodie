import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class FindAllCategoriesQueryDto {
    @ApiPropertyOptional({ description: 'Filter by vendor ID' })
    @IsOptional()
    @IsUUID()
    vendorId?: string;

    @ApiPropertyOptional({ type: Boolean, description: 'Filter categories shown on homepage' })
    @Type(() => Boolean)
    @IsOptional()
    @IsBoolean()
    showInHomepage?: boolean;

    @ApiPropertyOptional({ type: Number, description: 'Page number' })
    @Type(() => Number)
    @IsOptional()
    page?: number;

    @ApiPropertyOptional({ type: Number, description: 'Items per page' })
    @Type(() => Number)
    @IsOptional()
    limit?: number;
}
