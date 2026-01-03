import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { FcmService } from './services/fcm.service';
import { GeolocationService } from './services/geolocation.service';
import { FileStorageService } from './services/file-storage.service';
import { PaymentService } from './services/payment.service';
import { NotificationService } from './services/notification.service';
import { RedisService } from './services/redis.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SendEmailProcessor } from './jobs/send-email.processor';
import { SendPushNotificationProcessor } from './jobs/send-push-notification.processor';
import { ProcessOrderProcessor } from './jobs/process-order.processor';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get('redis');
        return {
          redis: {
            host: redisConfig?.host || 'localhost',
            port: redisConfig?.port || 6379,
            password: redisConfig?.password,
            db: redisConfig?.db || 0,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'email' },
      { name: 'push-notification' },
      { name: 'order-processing' },
    ),
  ],
  providers: [
    EmailService,
    SmsService,
    FcmService,
    GeolocationService,
    FileStorageService,
    PaymentService,
    NotificationService,
    RedisService,
    SendEmailProcessor,
    SendPushNotificationProcessor,
    ProcessOrderProcessor,
  ],
  exports: [
    EmailService,
    SmsService,
    FcmService,
    GeolocationService,
    FileStorageService,
    PaymentService,
    NotificationService,
    RedisService,
  ],
})
export class SharedModule {}
