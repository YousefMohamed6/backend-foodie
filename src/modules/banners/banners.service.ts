import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import { CreateBannerDto } from './dto/create-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) { }

  private readonly CACHE_KEY_PREFIX = 'banners:';

  async findAll(position?: string) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}all:${position || 'global'}`;
    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const where: Prisma.BannerWhereInput = { isActive: true };
        if (position) where.position = position;
        return this.prisma.banner.findMany({ where });
      },
      1800, // 30 mins
      60, // 60s for empty
    );
  }

  async findOne(id: string) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}id:${id}`;
    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const banner = await this.prisma.banner.findUnique({ where: { id } });
        if (!banner) {
          throw new NotFoundException('BANNER_NOT_FOUND');
        }
        return banner;
      },
      3600,
    );
  }

  async create(data: CreateBannerDto) {
    const result = await this.prisma.banner.create({ data });
    await this.invalidateBannersCache();
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    const result = await this.prisma.banner.update({
      where: { id },
      data: { isActive: false },
    });
    await this.invalidateBannersCache();
    await this.redisService.del(`${this.CACHE_KEY_PREFIX}id:${id}`);
    return result;
  }

  private async invalidateBannersCache() {
    await this.redisService.delPattern(`${this.CACHE_KEY_PREFIX}all:*`);
  }
}
