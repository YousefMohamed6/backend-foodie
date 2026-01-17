import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsSchedulerService } from './subscriptions.scheduler.service';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [SharedModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsSchedulerService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule { }
