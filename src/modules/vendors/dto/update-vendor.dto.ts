import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    specialDiscountEnable?: boolean;
}
