import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CashbackModule } from '../cashback/cashback.module';
import { CouponsModule } from '../coupons/coupons.module';
import { DriversModule } from '../drivers/drivers.module';
import { ProductsModule } from '../products/products.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { VendorsModule } from '../vendors/vendors.module';
import { WalletModule } from '../wallet/wallet.module';
import { ManagerCashController } from './manager-cash.controller';
import { OrderManagementService } from './order-management.service';
import { OrderPricingService } from './order-pricing.service';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { OrdersService } from './orders.service';
@Module({
  imports: [
    forwardRef(() => ProductsModule),
    forwardRef(() => VendorsModule),
    forwardRef(() => DriversModule),
    CouponsModule,
    CashbackModule,
    WalletModule,
    ReviewsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [OrdersController, ManagerCashController],
  providers: [OrdersService, OrdersGateway, OrderPricingService, OrderManagementService],
  exports: [OrdersService, OrdersGateway, OrderPricingService, OrderManagementService],
})
export class OrdersModule { }
