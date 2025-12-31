import { Module, forwardRef } from '@nestjs/common';
import { VendorsModule } from '../vendors/vendors.module';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

@Module({
  imports: [forwardRef(() => VendorsModule)],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
