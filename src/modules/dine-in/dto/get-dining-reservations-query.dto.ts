import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetDiningReservationsQueryDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Filter for upcoming reservations (true/false)',
  })
  @Type(() => Boolean)
  @IsOptional()
  @IsBoolean()
  isUpcoming?: boolean;
}
