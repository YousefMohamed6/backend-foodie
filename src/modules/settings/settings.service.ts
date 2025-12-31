import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsGateway } from './settings.gateway';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private settingsGateway: SettingsGateway,
  ) {}

  async findAll() {
    const settings = await this.prisma.setting.findMany();
    return settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
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
