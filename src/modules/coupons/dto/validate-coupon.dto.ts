import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsUUID, Min } from 'class-validator';

export class ValidateCouponDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    code: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsUUID()
    vendorId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    orderAmount: number;
}
