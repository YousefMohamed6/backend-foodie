import { ApiProperty } from '@nestjs/swagger';

export class MarsoulResponseDto {
  @ApiProperty({ description: 'Full name of the manager' })
  managerName: string;

  @ApiProperty({ description: 'Phone number of the manager' })
  phone: string;

  @ApiProperty({ description: 'ID of the zone associated with the manager' })
  zoneId: string;

  @ApiProperty({ description: 'Name of the zone' })
  zoneName: string;
}
