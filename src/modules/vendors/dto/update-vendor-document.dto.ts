import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateVendorDocumentDto {
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @IsString()
  @IsOptional()
  frontImage?: string;

  @IsString()
  @IsOptional()
  backImage?: string;
}
