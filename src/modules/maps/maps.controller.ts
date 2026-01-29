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

import { ZonesService } from '../zones/zones.service';

@ApiTags('Maps')
@ApiBearerAuth()
@Controller('maps')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MapsController {
  constructor(
    private readonly mapsService: MapsService,
    private readonly zonesService: ZonesService,
  ) { }

  @Get('check-zone')
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR)
  @ApiOperation({ summary: 'Check if location is within any zone' })
  @ApiQuery({ name: 'lat', required: true, type: Number })
  @ApiQuery({ name: 'lng', required: true, type: Number })
  async checkZone(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const zone = await this.zonesService.findZoneByLocation(
      parseFloat(lat),
      parseFloat(lng),
    );
    return {
      inZone: !!zone,
      zone: zone,
    };
  }

  @Get('route')
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.DRIVER, UserRole.ADMIN, UserRole.MANAGER)
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
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.DRIVER, UserRole.ADMIN, UserRole.MANAGER)
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
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.DRIVER, UserRole.ADMIN, UserRole.MANAGER)
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
  @Roles(UserRole.CUSTOMER, UserRole.VENDOR, UserRole.DRIVER, UserRole.ADMIN, UserRole.MANAGER)
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
