import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name);

  constructor(private configService: ConfigService) { }

  async getRoute(
    sourceLat: number,
    sourceLng: number,
    destLat: number,
    destLng: number,
  ): Promise<{ lat: number; lng: number }[]> {
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
        return [];
      }

      const points = data.routes[0]?.overview_polyline?.points;
      if (!points) return [];

      return this.decodePolyline(points);
    } catch (error) {
      this.logger.error('Failed to fetch route from Google Maps:', error);
      return [];
    }
  }

  private decodePolyline(encoded: string): { lat: number; lng: number }[] {
    const points: { lat: number; lng: number }[] = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
    return points;
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
