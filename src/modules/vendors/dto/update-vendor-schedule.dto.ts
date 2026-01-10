import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsArray,
    IsBoolean,
    IsInt,
    IsString,
    Matches,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class TimeslotDto {
    @ApiProperty()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: i18nValidationMessage('messages.VALIDATION_OPEN_TIME_FORMAT'),
    })
    openTime: string;

    @ApiProperty()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: i18nValidationMessage('messages.VALIDATION_CLOSE_TIME_FORMAT'),
    })
    closeTime: string;

    @ApiProperty()
    @IsBoolean()
    isActive: boolean;
}

export class UpdateVendorScheduleDto {
    @ApiProperty()
    @IsInt()
    @Min(0, { message: i18nValidationMessage('messages.VALIDATION_DAY_ID_RANGE') })
    @Max(6, { message: i18nValidationMessage('messages.VALIDATION_DAY_ID_RANGE') })
    dayId: number;

    @ApiProperty({ type: [TimeslotDto] })
    @IsArray({ message: i18nValidationMessage('messages.VALIDATION_TIMESLOTS_ARRAY') })
    @ValidateNested({ each: true })
    @Type(() => TimeslotDto)
    timeslots: TimeslotDto[];
}
