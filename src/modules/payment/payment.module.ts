import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { WalletModule } from '../wallet/wallet.module';
import { FawaterakWebhookController } from './fawaterak-webhook.controller';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [SharedModule, PrismaModule, WalletModule],
  controllers: [PaymentController, FawaterakWebhookController],
  providers: [PaymentService],
})
export class PaymentModule { }
