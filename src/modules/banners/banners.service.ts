import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) { }

  async findAll(position?: string) {
    const where: Prisma.BannerWhereInput = { isActive: true };
    if (position) where.position = position;
    return this.prisma.banner.findMany({ where });
  }

  async findOne(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException('BANNER_NOT_FOUND');
    }
    return banner;
  }

  async create(data: CreateBannerDto) {
    return this.prisma.banner.create({ data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.banner.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
