import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsUrl,
  IsString,
} from 'class-validator';

export class TopUpWalletDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  paymentGateway: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  failUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  pendingUrl?: string;
}

export class WithdrawWalletDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  withdrawMethodId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsObject()
  accountDetails: Record<string, any>;
}

export class SetWithdrawMethodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  stripe?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  razorpay?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  paypal?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  flutterwave?: Record<string, any>;
}
