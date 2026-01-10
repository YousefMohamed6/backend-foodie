import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MapsService } from './maps.service';

@ApiTags('Maps')
@ApiBearerAuth()
@Controller('maps')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MapsController {
  constructor(private readonly mapsService: MapsService) { }

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

  @Get('autocomplete')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Search places' })
  @ApiQuery({ name: 'input', required: true, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  async searchPlaces(
    @Query('input') input: string,
    @Query('language') language?: string,
  ) {
    return this.mapsService.searchPlaces(input, language);
  }
  @Get('geocode')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get coordinates from address string' })
  @ApiQuery({ name: 'address', required: true, type: String })
  @ApiQuery({ name: 'language', required: false, type: String })
  async getGeocode(
    @Query('address') address: string,
    @Query('language') language?: string,
  ) {
    return this.mapsService.getGeocode(address, language);
  }
  @Get('reverse-geocode')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get address from coordinates' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  @ApiQuery({ name: 'language', required: false, type: String })
  async reverseGeocode(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('language') language?: string,
  ) {
    return this.mapsService.reverseGeocode(
      parseFloat(lat),
      parseFloat(lng),
      language,
    );
  }
}
