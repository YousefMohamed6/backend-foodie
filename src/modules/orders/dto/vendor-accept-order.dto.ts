import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class VendorAcceptOrderDto {
    @ApiProperty({ required: false, description: 'Estimated preparation time in minutes' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    preparationTime?: number;
}
