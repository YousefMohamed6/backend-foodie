import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MarkOrderDeliveredDto {
  @ApiPropertyOptional({
    description:
      'The 6-digit OTP for delivery confirmation (Required for wallet orders)',
  })
  @IsString()
  @IsOptional()
  otp?: string;
}
