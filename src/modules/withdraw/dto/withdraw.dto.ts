import { WithdrawalMethod, WithdrawStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateWithdrawRequestDto {
  @IsNumber()
  @Min(10) // Amount >= 10
  @Type(() => Number)
  amount: number;

  @IsEnum(WithdrawalMethod)
  @IsOptional()
  method: WithdrawalMethod = WithdrawalMethod.MANUAL;

  @IsString()
  @IsOptional()
  payoutAccountId?: string;

  @IsObject()
  @IsOptional()
  accountDetails?: object;
}

export class AdminApproveWithdrawDto {
  @IsString()
  @IsOptional()
  adminNotes?: string;
}

export class AdminRejectWithdrawDto {
  @IsString()
  @IsOptional()
  adminNotes?: string;
}

export class AdminCompleteWithdrawDto {
  @IsString()
  @IsOptional()
  referenceId?: string;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}

export class WithdrawResponseDto {
  id: string;
  amount: number;
  status: WithdrawStatus;
  method: WithdrawalMethod;
  createdAt: Date;
  completedAt?: Date;
  referenceId?: string;
  adminNotes?: string;
}
