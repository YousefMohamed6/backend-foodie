import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDriverDto {
  @ApiProperty({ example: 'Bike' })
  @IsString()
  @IsNotEmpty()
  vehicleType: string;

  @ApiProperty({ example: 'ABC-123' })
  @IsString()
  @IsNotEmpty()
  licensePlate: string;
}
