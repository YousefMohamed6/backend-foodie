import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../products/products.service';
import { VendorsService } from '../vendors/vendors.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly productsService: ProductsService,
  ) {}

  @Get('restaurants')
  @ApiOperation({ summary: 'Search for restaurants' })
  searchRestaurants(@Query('query') query: string) {
    return this.vendorsService.search(query);
  }

  @Get('items')
  @ApiOperation({ summary: 'Search for items' })
  searchItems(@Query('query') query: string) {
    return this.productsService.search(query);
  }
}
