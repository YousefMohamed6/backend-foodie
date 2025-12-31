import { Module, forwardRef } from '@nestjs/common';
import { VendorsModule } from '../vendors/vendors.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [forwardRef(() => VendorsModule)],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
