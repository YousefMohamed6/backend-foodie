import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);

  constructor(private prisma: PrismaService) { }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
      Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Get nearest vendors using PostGIS (if available) or Haversine formula
   */
  async getNearestVendors(
    latitude: number,
    longitude: number,
    radius: number = 10,
    isDining?: boolean,
  ) {
    try {
      // Try PostGIS query first
      const vendors = await this.prisma.$queryRaw<any[]>`
        SELECT 
          v.*,
          ST_Distance(
            ST_MakePoint(v.longitude::float, v.latitude::float)::geography,
            ST_MakePoint(${longitude}::float, ${latitude}::float)::geography
          ) / 1000 AS distance_km
        FROM vendors v
        WHERE 
          v.is_active = true
          AND ST_DWithin(
            ST_MakePoint(v.longitude::float, v.latitude::float)::geography,
            ST_MakePoint(${longitude}::float, ${latitude}::float)::geography,
            ${radius * 1000}
          )
          ${isDining !== undefined ? (isDining ? this.prisma.$queryRaw`AND v.is_dine_in_active = true` : this.prisma.$queryRaw`AND v.is_dine_in_active = false`) : this.prisma.$queryRaw``}
        ORDER BY distance_km ASC
        LIMIT 20
      `;
      return vendors;
    } catch (error) {
      // Fallback to Haversine if PostGIS not available
      return this.getNearestVendorsFallback(
        latitude,
        longitude,
        radius,
        isDining,
      );
    }
  }

  /**
   * Fallback method using Haversine formula when PostGIS is not available
   */
  private async getNearestVendorsFallback(
    latitude: number,
    longitude: number,
    radius: number = 10,
    isDining?: boolean,
  ) {
    const vendors = await this.prisma.vendor.findMany({
      where: {
        isActive: true,
        ...(isDining !== undefined ? { isDineInActive: isDining } : {}),
      },
    });

    const vendorsWithDistance = vendors
      .map((vendor) => {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          Number(vendor.latitude),
          Number(vendor.longitude),
        );
        return {
          ...vendor,
          distance_km: distance,
        };
      })
      .filter((v) => v.distance_km <= radius)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 20);

    return vendorsWithDistance;
  }

  /**
   * Get tax list based on location (find zone)
   */
  async getTaxList(latitude: number, longitude: number) {
    try {
      // Try PostGIS query first
      const zones = await this.prisma.$queryRaw<any[]>`
        SELECT z.*
        FROM zones z
        WHERE 
          z.is_publish = true
          AND ST_Contains(
            z.area::geometry,
            ST_MakePoint(${longitude}::float, ${latitude}::float)::geometry
          )
        LIMIT 1
      `;

      const zone = zones?.[0];
      if (!zone) {
        // Fallback: find nearest zone
        const nearestZone = await this.getNearestZone(latitude, longitude);
        if (!nearestZone) {
          return [];
        }

        // Get taxes for the zone's country or default
        const taxes = await this.prisma.tax.findMany({
          where: {
            isActive: true,
          },
        });
        return taxes;
      }
    } catch (error) {
      // Fallback: find nearest zone
      const nearestZone = await this.getNearestZone(latitude, longitude);
      if (!nearestZone) {
        return [];
      }
    }

    // Get taxes for the zone's country or default
    const taxes = await this.prisma.tax.findMany({
      where: {
        isActive: true,
      },
    });

    return taxes;
  }

  private async getNearestZone(latitude: number, longitude: number) {
    const zones = await this.prisma.zone.findMany({
      where: { isPublish: true },
    });

    if (zones.length === 0) return null;

    let nearestZone = zones[0];
    let minDistance = Infinity;

    for (const zone of zones) {
      if (zone.latitude && zone.longitude) {
        const distance = this.calculateDistance(
          latitude,
          longitude,
          zone.latitude,
          zone.longitude,
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestZone = zone;
        }
      }
    }

    return nearestZone;
  }

  /**
   * Calculate delivery charge based on distance
   */
  async calculateDeliveryCharge(
    vendorId: string,
    latitude: number,
    longitude: number,
  ): Promise<number> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException('VENDOR_NOT_FOUND');
    }

    const distance = this.calculateDistance(
      latitude,
      longitude,
      Number(vendor.latitude),
      Number(vendor.longitude),
    );

    // Default delivery charge calculation
    // Can be customized based on vendor settings
    const baseCharge = 2.0; // Base delivery charge
    const perKmCharge = 0.5; // Charge per kilometer
    const maxCharge = 10.0; // Maximum delivery charge

    const charge = Math.min(baseCharge + distance * perKmCharge, maxCharge);
    return Math.round(charge * 100) / 100; // Round to 2 decimal places
  }
}
