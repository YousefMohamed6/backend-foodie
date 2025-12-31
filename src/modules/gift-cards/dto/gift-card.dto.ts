import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PurchaseGiftCardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentMethod?: string;
}

export class RedeemGiftCardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}
