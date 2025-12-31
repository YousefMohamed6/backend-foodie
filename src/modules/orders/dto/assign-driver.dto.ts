import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignDriverDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  driverId: string;
}
