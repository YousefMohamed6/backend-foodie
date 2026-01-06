import { Module, forwardRef } from '@nestjs/common';
import { CashbackModule } from '../cashback/cashback.module';
import { CouponsModule } from '../coupons/coupons.module';
import { DriversModule } from '../drivers/drivers.module';
import { ProductsModule } from '../products/products.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { VendorsModule } from '../vendors/vendors.module';
import { WalletModule } from '../wallet/wallet.module';
import { OrdersController } from './orders.controller';
import { OrdersGateway } from './orders.gateway';
import { OrdersService } from './orders.service';
import { ManagerCashController } from './manager-cash.controller';
@Module({
  imports: [
    forwardRef(() => ProductsModule),
    forwardRef(() => VendorsModule),
    forwardRef(() => DriversModule),
    CouponsModule,
    CashbackModule,
    WalletModule,
    ReviewsModule,
  ],
  controllers: [OrdersController, ManagerCashController],
  providers: [OrdersService, OrdersGateway],
  exports: [OrdersService, OrdersGateway],
})
export class OrdersModule { }
