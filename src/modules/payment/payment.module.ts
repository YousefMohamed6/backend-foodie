import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { SharedModule } from '../../shared/shared.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [SharedModule, PrismaModule],
  controllers: [PaymentController],
})
export class PaymentModule {}

