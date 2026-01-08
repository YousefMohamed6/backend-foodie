import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import emailConfig from './config/email.config';
import fcmConfig from './config/fcm.config';
import redisConfig from './config/redis.config';
import smsConfig from './config/sms.config';
import storageConfig from './config/storage.config';
import { AddressesModule } from './modules/addresses/addresses.module';
import { AdminUIModule } from './modules/admin-ui/admin-ui.module';
import { AdminModule } from './modules/admin/admin.module';
import { AdvertisementsModule } from './modules/advertisements/advertisements.module';
import { AuthModule } from './modules/auth/auth.module';
import { BannersModule } from './modules/banners/banners.module';
import { CashbackModule } from './modules/cashback/cashback.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ChatModule } from './modules/chat/chat.module';
import { ConfigModule as CustomConfigModule } from './modules/config/config.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { DineInModule } from './modules/dine-in/dine-in.module';
import { FavouritesModule } from './modules/favourites/favourites.module';
import { GiftCardsModule } from './modules/gift-cards/gift-cards.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { ManagerAuditModule } from './modules/manager-audit/manager-audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductsModule } from './modules/products/products.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SearchModule } from './modules/search/search.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StoriesModule } from './modules/stories/stories.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SupportModule } from './modules/support/support.module';
import { TaxesModule } from './modules/taxes/taxes.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { ZonesModule } from './modules/zones/zones.module';


import { EmailTemplatesModule } from './modules/email-templates/email-templates.module';
import { OnBoardingModule } from './modules/onboarding/onboarding.module';

import { AttributesModule } from './modules/attributes/attributes.module';
import { ReviewAttributesModule } from './modules/review-attributes/review-attributes.module';

import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { MapsModule } from './modules/maps/maps.module';
import { MarsoulModule } from './modules/marsoul/marsoul.module';
import { PaymentModule } from './modules/payment/payment.module';
import { VendorTypesModule } from './modules/vendor-types/vendor-types.module';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './shared/shared.module';

import * as Joi from 'joi';
import { AcceptLanguageResolver, HeaderResolver, I18nModule } from 'nestjs-i18n';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        appConfig,
        redisConfig,
        storageConfig,
        emailConfig,
        smsConfig,
        fcmConfig,
      ],
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
        GOOGLE_MAPS_API_KEY: Joi.string().optional(), // Make optional for now, or required if critical
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    I18nModule.forRoot({
      fallbackLanguage: 'ar',
      loaderOptions: {
        path: join(__dirname, '..', 'i18n/'),
        watch: true,
      },
      resolvers: [
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
    }),


    UsersModule,
    AuthModule,
    AddressesModule,
    VendorsModule,
    ProductsModule,
    OrdersModule,
    WalletModule,
    CategoriesModule,
    CouponsModule,
    ReviewsModule,
    UploadModule,
    // DriversModule,
    ZonesModule,
    SettingsModule,
    CustomConfigModule,
    SubscriptionsModule,
    GiftCardsModule,
    ReferralsModule,
    ChatModule,
    NotificationsModule,
    FavouritesModule,
    CashbackModule,
    StoriesModule,
    AdvertisementsModule,
    BannersModule,
    SearchModule,
    AdminModule,
    AdminUIModule,
    SupportModule,
    DineInModule,
    TaxesModule,
    CurrenciesModule,
    LanguagesModule,
    EmailTemplatesModule,
    OnBoardingModule,
    AttributesModule,
    ReviewAttributesModule,
    DocumentsModule,
    VendorTypesModule,
    PrismaModule,
    SharedModule,
    DeliveryModule,
    PaymentModule,
    MapsModule,
    ManagerAuditModule,
    MarsoulModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

  ],
})
export class AppModule {
  configure(consumer: import('@nestjs/common').MiddlewareConsumer) {
    const hpp = require('hpp');
    const { TimeoutMiddleware } = require('./common/middleware/timeout.middleware');
    const { XssSanitizationMiddleware } = require('./common/middleware/xss-sanitization.middleware');

    consumer
      .apply(hpp(), XssSanitizationMiddleware, TimeoutMiddleware)
      .exclude('api/v1/admin/(.*)', 'api/v1/admin')
      .forRoutes('*');
  }
}
