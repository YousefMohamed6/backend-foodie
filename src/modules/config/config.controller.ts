import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OnboardingType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Configuration')
@Controller()
export class ConfigController {
  constructor(private prisma: PrismaService) {}
  @Get('languages')
  @ApiOperation({ summary: 'Get available languages' })
  getLanguages() {
    return {
      languages: [
        { code: 'en', name: 'English', nativeName: 'English' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      ],
    };
  }

  @Get('currency/current')
  @ApiOperation({ summary: 'Get current currency configuration' })
  getCurrency() {
    return {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      decimalDigits: 2,
      thousandsSeparator: ',',
      decimalSeparator: '.',
      symbolAtEnd: false,
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
  getTaxes() {
    return {
      taxes: [{ id: '1', name: 'VAT', rate: 15, type: 'percent' }],
    };
  }

  @Get('delivery/charge')
  @ApiOperation({ summary: 'Get delivery charge' })
  getDeliveryCharge() {
    return {
      charge: {
        amount: 5.0,
        currency: 'USD',
      },
    };
  }

  @Get('payment/settings')
  @ApiOperation({ summary: 'Get payment settings' })
  getPaymentSettings() {
    return {
      settings: {
        paypal_enabled: false,
        stripe_enabled: false,
        wallet_enabled: true,
        cash_on_delivery_enabled: true,
      },
    };
  }
}
