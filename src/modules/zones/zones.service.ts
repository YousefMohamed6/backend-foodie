import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isPointInPolygon } from '../../common/utils/geo.utils';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) { }

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
    return this.prisma.zone.create({
      data,
    });
  }

  findAll() {
    return this.prisma.zone.findMany();
  }

  async findOne(id: string) {
    const zone = await this.prisma.zone.findUnique({ where: { id } });
    if (!zone) {
      throw new NotFoundException(`Zone with ID ${id} not found`);
    }
    return zone;
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
    return this.prisma.zone.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.zone.delete({ where: { id } });
  }

  async findZoneByLocation(lat: number, lng: number) {
    const zones = await this.prisma.zone.findMany({
      where: { isPublish: true },
    });

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
