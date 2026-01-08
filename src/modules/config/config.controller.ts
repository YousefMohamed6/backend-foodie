import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OnboardingType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Configuration')
@Controller()
export class ConfigController {
  constructor(private prisma: PrismaService) { }

  @Get('languages')
  @ApiOperation({ summary: 'Get available languages' })
  async getLanguages() {
    const languages = await this.prisma.language.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        isRtl: true,
        image: true,
        isDefault: true,
        createdAt: false,
        updatedAt: false,
      },
    });
    return { languages };
  }

  @Get('currency/current')
  @ApiOperation({ summary: 'Get current currency configuration' })
  async getCurrency() {
    const currency = await this.prisma.currency.findFirst({
      where: { isDefault: true },
    });

    if (!currency) {
      return {
        code: 'EGP',
        symbol: 'جنية',
        decimalDigits: 2,
        symbolAtEnd: true,
        isDefault: true,
      };
    }

    return {
      code: currency.code,
      symbol: currency.symbol,
      decimalDigits: currency.decimal,
      symbolAtEnd: currency.isAfter,
    };
  }

  @Get('onboarding')
  @ApiOperation({ summary: 'Get onboarding list' })
  @ApiQuery({ name: 'type', enum: OnboardingType, required: false })
  async getOnboarding(@Query('type') type?: OnboardingType) {
    const where = type ? { type } : {};
    const onboarding = await this.prisma.onBoarding.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return {
      onboarding,
    };
  }

  @Get('tax')
  @ApiOperation({ summary: 'Get tax list' })
  async getTaxes() {
    const taxes = await this.prisma.tax.findMany({
      where: { isActive: true },
    });
    return { taxes };
  }

  @Get('delivery/charge')
  @ApiOperation({ summary: 'Get delivery charge' })
  async getDeliveryCharge() {
    const deliveryChargeSetting = await this.prisma.setting.findUnique({
      where: { key: 'delivery_charge' },
    });

    const currencySetting = await this.prisma.setting.findUnique({
      where: { key: 'currency_code' },
    });

    return {
      charge: {
        amount: deliveryChargeSetting ? parseFloat(deliveryChargeSetting.value) : 15.0,
        currency: currencySetting ? currencySetting.value : 'EGP',
      },
    };
  }

  @Get('payment/settings')
  @ApiOperation({ summary: 'Get payment settings' })
  async getPaymentSettings() {
    const settings = await this.prisma.setting.findMany({
      where: {
        key: {
          in: [
            'paypal_enabled',
            'stripe_enabled',
            'wallet_enabled',
            'cash_on_delivery_enabled',
          ],
        },
      },
    });

    const settingsMap = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value === 'true';
      return acc;
    }, {} as Record<string, boolean>);

    return {
      settings: {
        paypal_enabled: settingsMap.paypal_enabled ?? false,
        stripe_enabled: settingsMap.stripe_enabled ?? false,
        wallet_enabled: settingsMap.wallet_enabled ?? true,
        cash_on_delivery_enabled: settingsMap.cash_on_delivery_enabled ?? true,
      },
    };
  }


}
