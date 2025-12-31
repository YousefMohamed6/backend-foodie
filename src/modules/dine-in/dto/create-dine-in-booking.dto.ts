import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsDateString,
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsInt,
} from 'class-validator';

export class CreateDineInBookingDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    vendorId: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    authorId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    guestPhone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    guestFirstName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    guestLastName?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsEmail()
    guestEmail?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    occasion?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    specialRequest?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    totalGuest?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    firstVisit?: boolean;
}
