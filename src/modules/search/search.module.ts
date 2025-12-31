import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { VendorsModule } from '../vendors/vendors.module';
import { SearchController } from './search.controller';

@Module({
  imports: [VendorsModule, ProductsModule],
  controllers: [SearchController],
})
export class SearchModule {}
