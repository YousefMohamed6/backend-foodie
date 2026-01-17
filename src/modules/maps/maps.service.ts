import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
  async searchPlaces(input: string, language = 'ar'): Promise<string[]> {
    const key = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    if (!key) {
      throw new Error('Google Maps API key not configured');
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input,
    )}&key=${key}&language=${language}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        this.logger.error(`Google Places API error: ${data.status}`);
        // Return empty list on error or fail? User asks for list.
        return [];
      }

      return (data.predictions || []).map((p: any) => p.description);
    } catch (error) {
      this.logger.error('Failed to fetch places from Google Maps:', error);
      return [];
    }
  }
  async getGeocode(
    address: string,
    language = 'ar',
  ): Promise<{ lat: number; lng: number } | null> {
    const key = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    if (!key) {
      throw new Error('Google Maps API key not configured');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address,
    )}&key=${key}&language=${language}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      } else {
        this.logger.warn(`Google Geocoding API status: ${data.status}`);
        return null;
      }
    } catch (error) {
      this.logger.error('Failed to geocode address:', error);
      throw error;
    }
  }
  async reverseGeocode(
    lat: number,
    lng: number,
    language = 'ar',
  ): Promise<string> {
    const key = this.configService.get<string>('GOOGLE_MAPS_API_KEY');

    if (!key) {
      throw new Error('Google Maps API key not configured');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}&language=${language}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        return data.results[0].formatted_address || 'Unknown location';
      } else {
        this.logger.warn(`Google Reverse Geocoding API status: ${data.status}`);
        return 'Unknown location';
      }
    } catch (error) {
      this.logger.error('Failed to reverse geocode coordinates:', error);
      return 'Unknown location';
    }
  }
}
