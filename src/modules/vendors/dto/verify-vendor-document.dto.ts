import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyVendorDocumentDto {
  @IsString()
  @IsNotEmpty()
  vendorId: string;

  @IsString()
  @IsNotEmpty()
  documentId: string;

  @IsBoolean()
  @IsNotEmpty()
  isApproved: boolean;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
