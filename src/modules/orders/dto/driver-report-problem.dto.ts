import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DriverReportProblemDto {
  @ApiProperty({
    description: 'The reason why the delivery cannot be completed',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  reason: string;
}
