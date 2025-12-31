import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [DeliveryController],
})
export class DeliveryModule {}

