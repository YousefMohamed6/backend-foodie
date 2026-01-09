import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class FindAllProductsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ type: Boolean })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  publish?: boolean;

  @ApiPropertyOptional({ enum: ['TakeAway', 'DineIn'] })
  @IsOptional()
  @IsString()
  foodType?: string;
}
