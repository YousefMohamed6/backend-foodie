import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { normalizePhoneNumber } from '../../../common/utils/phone.utils';

export class SendOtpDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => normalizePhoneNumber(value))
  phoneNumber: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  countryCode: string;
}
