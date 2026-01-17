import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    subscriptionPlanId: string;
}
