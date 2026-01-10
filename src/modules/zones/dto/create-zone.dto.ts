import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateZoneDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  arabicName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  englishName: string;

  @ApiProperty({ type: [Object], description: 'Array of {lat, lng} points' })
  @IsArray()
  @IsNotEmpty()
  area: { lat: number; lng: number }[];

  @ApiProperty({ default: true })
  @IsBoolean()
  @IsOptional()
  isPublish?: boolean;
}
