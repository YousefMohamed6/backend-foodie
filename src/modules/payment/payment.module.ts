import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { FawaterakWebhookController } from './fawaterak-webhook.controller';
import { SharedModule } from '../../shared/shared.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [SharedModule, PrismaModule, WalletModule],
  controllers: [PaymentController, FawaterakWebhookController],
})
export class PaymentModule {}
