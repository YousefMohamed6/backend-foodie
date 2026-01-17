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
  ) {}

  private readonly CACHE_KEY_PREFIX = 'banners:';

  async findAll(position?: string) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}all:${position || 'global'}`;
    const cached = await this.redisService.get<any[]>(cacheKey);
    if (cached) return cached;

    const where: Prisma.BannerWhereInput = { isActive: true };
    if (position) where.position = position;
    const banners = await this.prisma.banner.findMany({ where });

    // Cache for 30 minutes
    await this.redisService.set(cacheKey, banners, 1800);
    return banners;
  }

  async findOne(id: string) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}id:${id}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return cached;

    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) {
      throw new NotFoundException('BANNER_NOT_FOUND');
    }

    await this.redisService.set(cacheKey, banner, 3600); // 1 hour
    return banner;
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
    // Simplified validation: in production, one might use Redis keys pattern Or a versioning key.
    // For now, we'll let TTL handle the list clearing OR we could del key by index if we track them.
    // Since banners are relatively few, we can clear the common global and main positions.
    const positions = ['home_top', 'home_middle', 'home_bottom', 'global'];
    for (const pos of positions) {
      await this.redisService.del(`${this.CACHE_KEY_PREFIX}all:${pos}`);
    }
    await this.redisService.del(`${this.CACHE_KEY_PREFIX}all:global`);
  }
}
