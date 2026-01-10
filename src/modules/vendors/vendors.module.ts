import { Module, forwardRef } from '@nestjs/common';
import { CouponsModule } from '../coupons/coupons.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { WalletModule } from '../wallet/wallet.module';
import { VendorsController } from './vendors.controller';
import { VendorsService } from './vendors.service';

import { VendorsGateway } from './vendors.gateway';

@Module({
  imports: [
    forwardRef(() => ProductsModule),
    forwardRef(() => ReviewsModule),
    forwardRef(() => OrdersModule),
    forwardRef(() => CouponsModule),
    WalletModule,
  ],
  controllers: [VendorsController],
  providers: [VendorsService, VendorsGateway],
  exports: [VendorsService],
})
export class VendorsModule { }
