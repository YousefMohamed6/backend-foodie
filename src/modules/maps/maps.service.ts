import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);

  constructor(private configService: ConfigService) {}

  async getRoute(
    sourceLat: number,
    sourceLng: number,
    destLat: number,
    destLng: number,
  ): Promise<any> {
    const key = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    if (!key) {
      throw new Error('Google Maps API key not configured');
    }

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${sourceLat},${sourceLng}&destination=${destLat},${destLng}&key=${key}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        this.logger.error(`Google Maps API error: ${data.status}`);
        throw new Error(`Failed to get route: ${data.status}`);
      }

      return {
        routes: data.routes,
        status: data.status,
        distance: data.routes[0]?.legs[0]?.distance,
        duration: data.routes[0]?.legs[0]?.duration,
        polyline: data.routes[0]?.overview_polyline,
      };
    } catch (error) {
      this.logger.error('Failed to fetch route from Google Maps:', error);
      throw error;
    }
  }
}
