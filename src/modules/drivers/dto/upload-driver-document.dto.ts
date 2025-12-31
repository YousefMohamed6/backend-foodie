import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadDriverDocumentDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    documentType: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    frontImage: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    backImage?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    documentNumber?: string;
}
