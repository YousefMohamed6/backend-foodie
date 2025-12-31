import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import storageConfig from './config/storage.config';
import emailConfig from './config/email.config';
import smsConfig from './config/sms.config';
import fcmConfig from './config/fcm.config';
import { AddressesModule } from './modules/addresses/addresses.module';
import { AdminModule } from './modules/admin/admin.module';
import { AdvertisementsModule } from './modules/advertisements/advertisements.module';
import { AuthModule } from './modules/auth/auth.module';
import { BannersModule } from './modules/banners/banners.module';
import { CashbackModule } from './modules/cashback/cashback.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ChatModule } from './modules/chat/chat.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { CurrenciesModule } from './modules/currencies/currencies.module';
import { DineInModule } from './modules/dine-in/dine-in.module';
import { FavouritesModule } from './modules/favourites/favourites.module';
import { GiftCardsModule } from './modules/gift-cards/gift-cards.module';
import { LanguagesModule } from './modules/languages/languages.module';
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

import { DocumentsModule } from './modules/documents/documents.module';
import { VendorTypesModule } from './modules/vendor-types/vendor-types.module';
import { PrismaModule } from './prisma/prisma.module';
import { SharedModule } from './shared/shared.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { PaymentModule } from './modules/payment/payment.module';
import { MapsModule } from './modules/maps/maps.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import * as Joi from 'joi';

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

    UsersModule,
    AuthModule,
    AddressesModule,
    VendorsModule,
    ProductsModule,
    OrdersModule,
    WalletModule,
    CategoriesModule,
    // DriversModule, // Temporarily disabled - has circular dependency with OrdersModule
    CouponsModule,
    ReviewsModule,
    UploadModule,
    ZonesModule,
    SettingsModule,
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
