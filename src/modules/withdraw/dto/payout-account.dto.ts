
import { WithdrawalMethod } from '@prisma/client';
import {
    IsBoolean,
    IsEnum,
    IsObject,
    IsOptional
} from 'class-validator';

export class CreatePayoutAccountDto {
    @IsEnum(WithdrawalMethod)
    method: WithdrawalMethod;

    @IsObject()
    details: Record<string, any>;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}

export class UpdatePayoutAccountDto {
    @IsObject()
    @IsOptional()
    details?: Record<string, any>;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}

export class PayoutAccountResponseDto {
    id: string;
    method: WithdrawalMethod;
    details: any;
    isDefault: boolean;
    createdAt: Date;
}
