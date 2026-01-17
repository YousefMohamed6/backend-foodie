import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import * as Prisma from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for restaurants' })
  searchRestaurants(
    @Query('query') query: string,
    @CurrentUser() user?: Prisma.User,
  ) {
    return this.vendorsService.search(query, undefined, undefined, user);
  }

  @Get('items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for items' })
  searchItems(
    @Query('query') query: string,
    @CurrentUser() user?: Prisma.User,
  ) {
    return this.productsService.search(query, undefined, undefined, user);
  }
}
