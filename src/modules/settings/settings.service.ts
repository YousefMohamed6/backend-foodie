import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import { APP_SETTINGS } from './settings.constants';
import { SettingsGateway } from './settings.gateway';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private settingsGateway: SettingsGateway,
    private redis: RedisService,
  ) { }

  private readonly CACHE_KEY = 'global:settings';
  private readonly CACHE_KEY_INDIVIDUAL = 'setting:';

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
    const cacheKey = `${this.CACHE_KEY_INDIVIDUAL}${key}`;
    const cached = await this.redis.get<string>(cacheKey);
    if (cached) return cached;

    const setting = await this.prisma.setting.findUnique({ where: { key } });
    if (!setting) {
      throw new NotFoundException('SETTING_NOT_FOUND');
    }

    await this.redis.set(cacheKey, setting.value, 3600); // 1 hour
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
    await this.redis.del(`${this.CACHE_KEY_INDIVIDUAL}${key}`);

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

  async getCommissionRate(type: 'vendor' | 'driver'): Promise<number> {
    const key =
      type === 'vendor'
        ? APP_SETTINGS.VENDOR_COMMISSION_RATE
        : APP_SETTINGS.DRIVER_COMMISSION_RATE;
    try {
      const value = await this.findOne(key);
      const rate = parseFloat(value);
      return isNaN(rate) ? 0 : rate;
    } catch {
      return 0;
    }
  }

  async getAdvertisementPrice(): Promise<number> {
    try {
      const value = await this.findOne(APP_SETTINGS.ADVERTISEMENT_PRICE);
      const price = parseFloat(value);
      return isNaN(price) ? 100 : price;
    } catch {
      return 100;
    }
  }

  async getPublicSettings() {
    const publicKeys = [
      APP_SETTINGS.WALLET_ENABLED,
      APP_SETTINGS.CASH_ON_DELIVERY_ENABLED,
      APP_SETTINGS.APP_NAME,
      APP_SETTINGS.APP_VERSION,
      APP_SETTINGS.ABOUT_US,
      APP_SETTINGS.TERMS_AND_CONDITIONS,
      APP_SETTINGS.PRIVACY_POLICY,
      APP_SETTINGS.STORY_ENABLED,
      APP_SETTINGS.GOOGLE_PLAY_LINK,
      APP_SETTINGS.APP_STORE_LINK,
      APP_SETTINGS.WEBSITE_URL,
      APP_SETTINGS.REFERRAL_ENABLED,
      APP_SETTINGS.REFERRAL_AMOUNT,
      APP_SETTINGS.SPECIAL_DISCOUNT_OFFER,
      APP_SETTINGS.SPECIAL_DISCOUNT_OFFER_ENABLE,
      APP_SETTINGS.AUTO_APPROVE_RESTAURANT,
      APP_SETTINGS.IS_CASHBACK_ACTIVE,
      APP_SETTINGS.IS_ENABLE_ADS_FEATURE,
      APP_SETTINGS.IS_SELF_DELIVERY_FEATURE,
      APP_SETTINGS.IS_RESTAURANT_VERIFICATION,
      APP_SETTINGS.MAP_TYPE,
      APP_SETTINGS.RADIUS,
      APP_SETTINGS.DRIVER_RADIUS,
      APP_SETTINGS.SCHEDULE_ORDER_TIME,
      APP_SETTINGS.SCHEDULE_ORDER_TIME_TYPE,
      APP_SETTINGS.STORE_URL,
      APP_SETTINGS.ADMIN_EMAIL,
      APP_SETTINGS.PLACEHOLDER_IMAGE,
      APP_SETTINGS.ORDER_RINGTONE_URL,
      APP_SETTINGS.LANGUAGE,
      APP_SETTINGS.ADMIN_COMMISSION,
    ];

    const allSettings = await this.findAll();
    const result: Record<string, any> = {};

    for (const key of publicKeys) {
      if (allSettings[key]) {
        try {
          result[key] = JSON.parse(allSettings[key]);
        } catch {
          result[key] = allSettings[key];
        }
      }
    }
    return result;
  }

  async getDeliverySettings() {
    const deliveryKeys = [
      APP_SETTINGS.MIN_DELIVERY_FEE,
      APP_SETTINGS.DELIVERY_FEE_PER_KM,
      APP_SETTINGS.MIN_DELIVERY_PAY,
    ];

    const allSettings = await this.findAll();
    const result: Record<string, number> = {};

    for (const key of deliveryKeys) {
      if (allSettings[key]) {
        result[key] = parseFloat(allSettings[key]) || 0;
      }
    }
    return result;
  }
}
