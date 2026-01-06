import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import { SettingsGateway } from './settings.gateway';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private settingsGateway: SettingsGateway,
    private redis: RedisService,
  ) { }

  private readonly CACHE_KEY = 'global:settings';

  async findAll() {
    // Try to get from cache first
    const cached = await this.redis.get<Record<string, string>>(this.CACHE_KEY);
    if (cached) return cached;

    const settings = await this.prisma.setting.findMany();
    const result = settings.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, string>,
    );

    // Cache for 1 hour
    await this.redis.set(this.CACHE_KEY, result, 3600);
    return result;
  }

  async findOne(key: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }
    return setting.value;
  }

  async update(key: string, value: string) {
    const setting = await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // Invalidate cache
    await this.redis.del(this.CACHE_KEY);

    // Emit real-time update
    this.settingsGateway.emitSettingsUpdate({ [key]: value });

    return setting;
  }

  async updateMany(settings: Record<string, string>) {
    const promises = Object.entries(settings).map(([key, value]) =>
      this.update(key, value),
    );
    await Promise.all(promises);
    const allSettings = await this.findAll();

    // Emit all settings update
    this.settingsGateway.emitSettingsUpdate(allSettings);

    return allSettings;
  }
}
