import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetDriversQueryDto {
  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filter for available drivers',
  })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
