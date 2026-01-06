import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OnboardingType, UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
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
        code: true,
        name: true,
      },
    });
    return { languages };
  }

  @Get('currency/current')
  @ApiOperation({ summary: 'Get current currency configuration' })
  async getCurrency() {
    const currency = await this.prisma.currency.findFirst({
      where: { isActive: true },
    });

    if (!currency) {
      return {
        code: 'EGP',
        symbol: 'جنية',
        decimalDigits: 2,
        symbolAtEnd: true,
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

  @Post('settings/initialize')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Initialize missing settings data' })
  async initializeSettings() {
    const defaultSettings = [
      // Payment Gateway Settings
      { key: 'paypal_enabled', value: 'false' },
      { key: 'stripe_enabled', value: 'false' },
      { key: 'razorpay_enabled', value: 'false' },
      { key: 'fawaterak_enabled', value: 'false' },
      { key: 'wallet_enabled', value: 'true' },
      { key: 'cash_on_delivery_enabled', value: 'true' },

      // Payment Gateway Credentials (empty by default)
      { key: 'stripe_public_key', value: '' },
      { key: 'stripe_secret_key', value: '' },
      { key: 'paypal_client_id', value: '' },
      { key: 'paypal_secret', value: '' },
      { key: 'razorpay_key', value: '' },
      { key: 'razorpay_secret', value: '' },

      // Delivery and Currency
      { key: 'delivery_charge', value: '15.0' },

      // App Configuration
      { key: 'app_name', value: 'Foodie' },
      { key: 'app_description', value: 'Food Delivery App' },
      { key: 'app_version', value: '1.0.0' },

      // Email Settings
      { key: 'email_enabled', value: 'false' },
      { key: 'smtp_host', value: '' },
      { key: 'smtp_port', value: '587' },
      { key: 'smtp_username', value: '' },
      { key: 'smtp_password', value: '' },
      { key: 'email_from', value: 'noreply@talqah.com' },

      // SMS Settings
      { key: 'sms_enabled', value: 'false' },
      { key: 'sms_provider', value: '' },
      { key: 'sms_api_key', value: '' },

      // Order Settings
      { key: 'min_order_amount', value: '0' },
      { key: 'max_order_amount', value: '10000' },
      { key: 'order_timeout_minutes', value: '30' },

      // Driver Settings
      { key: 'driver_commission_percentage', value: '10' },
      { key: 'driver_commission_type', value: 'percentage' },

      // Vendor Settings
      { key: 'vendor_commission_percentage', value: '15' },
      { key: 'vendor_commission_type', value: 'percentage' },

      // Referral Settings
      { key: 'referral_enabled', value: 'true' },
      { key: 'referral_bonus_amount', value: '50' },

      // Terms and Privacy
      { key: 'terms_url', value: '' },
      { key: 'privacy_url', value: '' },
      { key: 'about_us', value: 'About Us' },
      { key: 'contact_email', value: 'support@talqah.com' },
      { key: 'contact_phone', value: '' },
    ];

    const results: Array<{ key: string; status: string }> = [];

    for (const setting of defaultSettings) {
      const existingSetting = await this.prisma.setting.findUnique({
        where: { key: setting.key },
      });

      if (!existingSetting) {
        const created = await this.prisma.setting.create({
          data: setting,
        });
        results.push({ key: created.key, status: 'created' });
      } else {
        results.push({ key: setting.key, status: 'exists' });
      }
    }

    return {
      message: 'Settings initialization completed',
      results,
      summary: {
        total: defaultSettings.length,
        created: results.filter(r => r.status === 'created').length,
        existing: results.filter(r => r.status === 'exists').length,
      },
    };
  }
}
