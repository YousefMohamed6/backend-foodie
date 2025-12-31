import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { DriverStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { CreateDriverDto } from './create-driver.dto';

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @ApiPropertyOptional({ enum: DriverStatus })
  @IsEnum(DriverStatus)
  @IsOptional()
  status?: DriverStatus;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currentLat?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  currentLng?: number;
}
