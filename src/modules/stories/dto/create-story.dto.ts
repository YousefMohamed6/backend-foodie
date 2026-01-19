import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStoryDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  videoUrl: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoThumbnail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendorID?: string;

  @ApiPropertyOptional()
  @IsOptional()
  createdAt?: any;
}
