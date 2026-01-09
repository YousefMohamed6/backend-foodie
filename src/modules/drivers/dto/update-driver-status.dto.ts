import { ApiProperty } from '@nestjs/swagger';
import { DriverStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, Max, Min } from 'class-validator';

export class UpdateDriverStatusDto {
  @ApiProperty({ enum: DriverStatus })
  @IsEnum(DriverStatus)
  status: DriverStatus;

  @ApiProperty({ type: Boolean })
  @Type(() => Boolean)
  @IsBoolean()
  isOnline: boolean;

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
}
