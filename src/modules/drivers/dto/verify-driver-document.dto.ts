import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerifyDriverDocumentDto {

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
