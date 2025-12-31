import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemReferralDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  referralCode: string;
}
