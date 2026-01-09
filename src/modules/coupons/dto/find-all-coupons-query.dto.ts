import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class FindAllCouponsQueryDto {
  @ApiPropertyOptional({ type: Boolean })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;
}
