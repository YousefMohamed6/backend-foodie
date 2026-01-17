import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty()
  @IsString()
  arabicName: string;

  @ApiProperty()
  @IsString()
  englishName: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsNumber()
  durationDays: number;

  @ApiProperty()
  @IsNumber()
  productsLimit: number;

  @ApiProperty()
  @IsNumber()
  totalOrders: number;

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty()
  @IsString()
  place: string;

  @ApiProperty()
  @IsString()
  image: string;

  @ApiProperty()
  @IsString()
  type: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  planPoints: string[];

  @ApiProperty()
  @IsArray()
  features: { key: string; value: boolean }[];
}
