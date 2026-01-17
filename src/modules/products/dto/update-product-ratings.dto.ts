import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpdateProductRatingsDto {
    @ApiProperty()
    @IsNumber()
    @Min(0)
    reviewsSum: number;

    @ApiProperty()
    @IsNumber()
    @Min(0)
    reviewsCount: number;
}
