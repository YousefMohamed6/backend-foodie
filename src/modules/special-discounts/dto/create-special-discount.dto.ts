import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SpecialDiscountDto {
    @ApiProperty()
    @IsDateString()
    endDate: string;

    @ApiProperty()
    @IsNumber()
    discount: number;

    @ApiProperty()
    @IsString()
    couponCode: string;

    @ApiProperty()
    @IsString()
    photo: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    discountType?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    id?: string;

    @ApiProperty()
    @IsBoolean()
    isPublish: boolean;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class CreateSpecialDiscountDto {
    @ApiProperty({ type: [SpecialDiscountDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SpecialDiscountDto)
    discount: SpecialDiscountDto[];
}
