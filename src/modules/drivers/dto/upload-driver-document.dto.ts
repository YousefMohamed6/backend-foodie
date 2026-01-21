import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadDriverDocumentDto {

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  frontImage: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backImage?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  documentId: string;

}
