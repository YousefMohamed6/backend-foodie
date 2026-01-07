import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CurrenciesService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    return this.prisma.currency.findMany({ where: { isActive: true } });
  }

  async findCurrent() {
    // 1. Priority: Check for currency explicitly marked as default
    const defaultCurrency = await this.prisma.currency.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (defaultCurrency) {
      return defaultCurrency;
    }

    // 2. Fallback: Try settings (legacy behavior)
    const defaultCurrencySetting = await this.prisma.setting.findUnique({
      where: { key: 'default_currency_code' },
    });

    if (defaultCurrencySetting?.value) {
      // Find currency by code from settings
      const currency = await this.prisma.currency.findFirst({
        where: {
          code: defaultCurrencySetting.value,
          isActive: true,
        },
      });

      if (currency) {
        return currency;
      }
    }

    // Fallback: return first active currency
    return this.prisma.currency.findFirst({ where: { isActive: true } });
  }
}
