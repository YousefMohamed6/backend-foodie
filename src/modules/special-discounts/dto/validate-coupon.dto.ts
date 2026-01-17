import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateSpecialDiscountDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    couponCode: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    vendorId: string;
}
