import { Module } from '@nestjs/common';
import { SharedModule } from '../../shared/shared.module';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [SharedModule],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
