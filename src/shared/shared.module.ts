import { BullModule } from '@nestjs/bull';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CurrenciesModule } from '../modules/currencies/currencies.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProcessOrderProcessor } from './jobs/process-order.processor';
import { SendEmailProcessor } from './jobs/send-email.processor';
import { SendPushNotificationProcessor } from './jobs/send-push-notification.processor';
import { EmailService } from './services/email.service';
import { FawaterakService } from './services/fawaterak.service';
import { FcmService } from './services/fcm.service';
import { FileStorageService } from './services/file-storage.service';
import { GeolocationService } from './services/geolocation.service';
import { MailService } from './services/mail.service';
import { NotificationService } from './services/notification.service';
import { PaymentService } from './services/payment.service';
import { RedisService } from './services/redis.service';
import { SmsService } from './services/sms.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    CurrenciesModule,
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
    MailService,
    SmsService,
    FcmService,
    GeolocationService,
    FileStorageService,
    PaymentService,
    FawaterakService,
    NotificationService,
    RedisService,
    SendEmailProcessor,
    SendPushNotificationProcessor,
    ProcessOrderProcessor,
  ],
  exports: [
    EmailService,
    MailService,
    SmsService,
    FcmService,
    GeolocationService,
    FileStorageService,
    PaymentService,
    FawaterakService,
    NotificationService,
    RedisService,
  ],
})
export class SharedModule {}
