import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ProductExtraDto } from './product-extra.dto';

export class CreateProductDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsNumber()
  discountPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;


  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  itemAttributes?: string[];

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  takeawayOption?: boolean;


  @ApiProperty()
  @IsBoolean()
  isPublish: boolean;

  @ApiPropertyOptional({ type: [ProductExtraDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductExtraDto)
  extras?: ProductExtraDto[];
}
