import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubscribeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  planId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  paymentId?: string;
}
