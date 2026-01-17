import { Module, forwardRef } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthModule } from '../auth/auth.module';
import { CashbackModule } from '../cashback/cashback.module';
import { CouponsModule } from '../coupons/coupons.module';
import { DriversModule } from '../drivers/drivers.module';
import { ProductsModule } from '../products/products.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { SettingsModule } from '../settings/settings.module';
import { SpecialDiscountsModule } from '../special-discounts/special-discounts.module';
import { VendorsModule } from '../vendors/vendors.module';
import { WalletModule } from '../wallet/wallet.module';
import { CommissionService } from './commission.service';
import { ManagerCashController } from './manager-cash.controller';
import { OrderManagementService } from './order-management.service';
import { OrderPricingService } from './order-pricing.service';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { OrdersSchedulerService } from './orders.scheduler.service';
import { OrdersService } from './orders.service';
import {
  OrderCashService,
  OrderCommissionReportsService,
  OrderCreationService,
  OrderDeliveryService,
  OrderDisputeService,
  OrderDriverService,
  OrderQueryService,
  OrderVendorService,
} from './services';

@Module({
  imports: [
    forwardRef(() => ProductsModule),
    forwardRef(() => VendorsModule),
    forwardRef(() => DriversModule),
    forwardRef(() => CouponsModule),
    SpecialDiscountsModule,
    CashbackModule,
    WalletModule,
    ReviewsModule,
    SettingsModule,
    forwardRef(() => AuthModule),
    AnalyticsModule,
  ],
  controllers: [OrdersController, ManagerCashController],
  providers: [
    // Facade
    OrdersService,
    // Sub-services
    OrderCreationService,
    OrderQueryService,
    OrderDriverService,
    OrderVendorService,
    OrderDeliveryService,
    OrderCashService,
    OrderDisputeService,
    OrderCommissionReportsService,
    // Infrastructure
    OrdersGateway,
    OrderPricingService,
    OrderManagementService,
    CommissionService,
    OrdersSchedulerService,
  ],
  exports: [
    OrdersService,
    OrdersGateway,
    OrderPricingService,
    OrderManagementService,
    CommissionService,
  ],
})
export class OrdersModule { }
