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

    @ApiProperty()
    @IsBoolean()
    enable: boolean;

    @ApiProperty()
    @IsBoolean()
    public: boolean;
}

export class CreateSpecialDiscountDto {
    @ApiProperty({ type: [SpecialDiscountDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SpecialDiscountDto)
    discount: SpecialDiscountDto[];
}
