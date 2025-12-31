import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MapsService } from './maps.service';

@ApiTags('Maps')
@ApiBearerAuth()
@Controller('maps')
@UseGuards(JwtAuthGuard)
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('route')
  @ApiOperation({ summary: 'Get route directions from Google Maps' })
  @ApiQuery({ name: 'sourceLat', required: true, type: Number })
  @ApiQuery({ name: 'sourceLng', required: true, type: Number })
  @ApiQuery({ name: 'destLat', required: true, type: Number })
  @ApiQuery({ name: 'destLng', required: true, type: Number })
  async getRoute(
    @Query('sourceLat') sourceLat: string,
    @Query('sourceLng') sourceLng: string,
    @Query('destLat') destLat: string,
    @Query('destLng') destLng: string,
  ) {
    return this.mapsService.getRoute(
      parseFloat(sourceLat),
      parseFloat(sourceLng),
      parseFloat(destLat),
      parseFloat(destLng),
    );
  }
}

