import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Configuration')
@Controller()
export class ConfigController {
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
  getOnboarding() {
    return {
      onboarding: [
        {
          id: '1',
          title: 'Order Food',
          description: 'Easily order food from your favorite restaurants',
          image: 'onboarding1.png',
        },
        {
          id: '2',
          title: 'Fast Delivery',
          description: 'Real-time tracking and fast delivery',
          image: 'onboarding2.png',
        },
        {
          id: '3',
          title: 'Safe Payment',
          description: 'Multiple safe payment methods',
          image: 'onboarding3.png',
        },
      ],
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
        paypal_enabled: true,
        stripe_enabled: true,
        wallet_enabled: true,
        cash_on_delivery_enabled: true,
      },
    };
  }
}
