import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentService } from '../../shared/services/payment.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';

@ApiTags('Payment')
@ApiBearerAuth()
@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get payment settings' })
  async getSettings() {
    // Get payment settings from database or config
    const settings = await this.prisma.setting.findMany({
      where: {
        key: {
          in: [
            'stripe_enabled',
            'paypal_enabled',
            'razorpay_enabled',
            'fawaterak_enabled',
            'stripe_public_key',
            'paypal_client_id',
            'razorpay_key',
          ],
        },
      },
    });

    const settingsMap = settings.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      {} as Record<string, string>,
    );

    return {
      stripe: {
        enabled: settingsMap['stripe_enabled'] === 'true',
        publicKey: settingsMap['stripe_public_key'] || null,
      },
      paypal: {
        enabled: settingsMap['paypal_enabled'] === 'true',
        clientId: settingsMap['paypal_client_id'] || null,
      },
      razorpay: {
        enabled: settingsMap['razorpay_enabled'] === 'true',
        key: settingsMap['razorpay_key'] || null,
      },
      fawaterak: {
        enabled: settingsMap['fawaterak_enabled'] === 'true',
      },
    };
  }

  @Post('process')
  @Throttle({ default: { ttl: 60000, limit: 5 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Process payment' })
  async processPayment(@Body() body: ProcessPaymentDto) {
    return this.paymentService.processPayment(
      body.amount,
      body.paymentMethod,
      body.paymentGateway,
      { orderId: body.orderId },
    );
  }
}
