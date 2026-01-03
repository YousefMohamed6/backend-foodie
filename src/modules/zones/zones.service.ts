import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  create(createZoneDto: CreateZoneDto) {
    const data: Prisma.ZoneCreateInput = {
      ...createZoneDto,
      coordinates:
        createZoneDto.coordinates as unknown as Prisma.InputJsonValue,
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
    const data: Prisma.ZoneUpdateInput = {
      ...updateZoneDto,
      coordinates: updateZoneDto.coordinates
        ? (updateZoneDto.coordinates as unknown as Prisma.InputJsonValue)
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
}
