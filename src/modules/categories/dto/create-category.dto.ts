import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCategoryDto {

  @ApiProperty({ example: 'Starters' })
  @IsString()
  englishName: string;

  @ApiProperty({ example: 'مقبلات' })
  @IsString()
  arabicName: string;

  @ApiPropertyOptional({ example: 'image-url.jpg' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ example: 'vendor-uuid' })
  @IsUUID()
  vendorId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

}


