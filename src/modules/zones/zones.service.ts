import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isPointInPolygon } from '../../common/utils/geo.utils';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) { }

  private readonly CACHE_KEYS = {
    ALL_ZONES: 'zones:all',
    ZONE_BY_ID: (id: string) => `zones:id:${id}`,
    PUBLISHED_ZONES: 'zones:published',
  };

  private async invalidateZonesCache() {
    await this.redisService.delPattern('zones:*');
  }

  async create(createZoneDto: CreateZoneDto) {
    const existingArabic = await this.prisma.zone.findFirst({
      where: { arabicName: createZoneDto.arabicName },
    });

    if (existingArabic) {
      throw new BadRequestException('DUPLICATE_ZONE_NAME_AR');
    }

    const existingEnglish = await this.prisma.zone.findFirst({
      where: { englishName: createZoneDto.englishName },
    });

    if (existingEnglish) {
      throw new BadRequestException('DUPLICATE_ZONE_NAME_EN');
    }

    const data: Prisma.ZoneCreateInput = {
      ...createZoneDto,
      area: createZoneDto.area as unknown as Prisma.InputJsonValue,
    };
    const result = await this.prisma.zone.create({
      data,
    });
    await this.invalidateZonesCache();
    return result;
  }

  async findAll() {
    return this.redisService.getOrSet(
      this.CACHE_KEYS.ALL_ZONES,
      async () => {
        return this.prisma.zone.findMany();
      },
      3600, // 1 hour
    );
  }

  async findOne(id: string) {
    const cacheKey = this.CACHE_KEYS.ZONE_BY_ID(id);
    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const zone = await this.prisma.zone.findUnique({ where: { id } });
        if (!zone) {
          throw new NotFoundException(`Zone with ID ${id} not found`);
        }
        return zone;
      },
      3600,
    );
  }

  async update(id: string, updateZoneDto: UpdateZoneDto) {
    await this.findOne(id);

    if (updateZoneDto.arabicName) {
      const existingArabic = await this.prisma.zone.findFirst({
        where: {
          arabicName: updateZoneDto.arabicName,
          NOT: { id },
        },
      });

      if (existingArabic) {
        throw new BadRequestException('DUPLICATE_ZONE_NAME_AR');
      }
    }

    if (updateZoneDto.englishName) {
      const existingEnglish = await this.prisma.zone.findFirst({
        where: {
          englishName: updateZoneDto.englishName,
          NOT: { id },
        },
      });

      if (existingEnglish) {
        throw new BadRequestException('DUPLICATE_ZONE_NAME_EN');
      }
    }

    const data: Prisma.ZoneUpdateInput = {
      ...updateZoneDto,
      area: updateZoneDto.area
        ? (updateZoneDto.area as unknown as Prisma.InputJsonValue)
        : undefined,
    };
    const result = await this.prisma.zone.update({
      where: { id },
      data,
    });
    await this.invalidateZonesCache();
    await this.redisService.del(this.CACHE_KEYS.ZONE_BY_ID(id));
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    const result = await this.prisma.zone.delete({ where: { id } });
    await this.invalidateZonesCache();
    await this.redisService.del(this.CACHE_KEYS.ZONE_BY_ID(id));
    return result;
  }

  async findZoneByLocation(lat: number, lng: number) {
    const zones = await this.redisService.getOrSet(
      this.CACHE_KEYS.PUBLISHED_ZONES,
      async () => {
        return this.prisma.zone.findMany({
          where: { isPublish: true },
        });
      },
      1800, // 30 mins
    );

    for (const zone of zones) {
      const area = zone.area as unknown as { lat: number; lng: number }[];
      if (area && Array.isArray(area)) {
        if (isPointInPolygon({ lat, lng }, area)) {
          return zone;
        }
      }
    }

    return null;
  }
}
