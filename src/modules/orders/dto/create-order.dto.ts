import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  vendorId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  products: OrderItemDto[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  addressId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cashbackId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  deliveryCharge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  tipAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  takeAway?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduleTime?: string;
}
