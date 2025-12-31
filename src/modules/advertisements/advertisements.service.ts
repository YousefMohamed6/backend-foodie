import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';

@Injectable()
export class AdvertisementsService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.advertisement.findMany({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const ad = await this.prisma.advertisement.findUnique({ where: { id } });
    if (!ad) {
      throw new NotFoundException(`Advertisement with ID ${id} not found`);
    }
    return ad;
  }

  async create(data: CreateAdvertisementDto) {
    return this.prisma.advertisement.create({ data });
  }

  async update(id: string, data: UpdateAdvertisementDto) {
    await this.findOne(id);
    return this.prisma.advertisement.update({
      where: { id },
      data,
    });
  }

  async toggle(id: string) {
    const ad = await this.findOne(id);
    return this.prisma.advertisement.update({
      where: { id },
      data: { isActive: !ad.isActive },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.advertisement.delete({ where: { id } });
  }
}
