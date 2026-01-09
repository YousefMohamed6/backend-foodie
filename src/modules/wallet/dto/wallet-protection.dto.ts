import { DeliveryConfirmationType, DisputeStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfirmDeliveryDto {
    @IsEnum(DeliveryConfirmationType)
    @IsNotEmpty()
    confirmationType: DeliveryConfirmationType;

    @IsOptional()
    @IsString()
    otp?: string;

    @IsOptional()
    evidence?: any;
}

export class CreateDisputeDto {
    @IsNotEmpty()
    @IsString()
    orderId: string;

    @IsNotEmpty()
    @IsString()
    reason: string;

    @IsOptional()
    customerEvidence?: {
        photos?: string[];
        notes?: string;
        timestamp?: string;
    };
}

export class ResolveDisputeDto {
    @IsNotEmpty()
    @IsString()
    disputeId: string;

    @IsEnum(DisputeStatus)
    @IsNotEmpty()
    resolution: DisputeStatus;

    @IsNotEmpty()
    @IsString()
    resolutionReason: string;

    @IsOptional()
    @IsString()
    resolutionType?: string; // FULL_REFUND | FULL_RELEASE | PARTIAL | FRAUD
}

export class AddDriverResponseDto {
    @IsNotEmpty()
    @IsString()
    disputeId: string;

    @IsNotEmpty()
    @IsString()
    response: string;

    @IsOptional()
    driverEvidence?: {
        photos?: string[];
        gpsData?: any;
        notes?: string;
    };
}
