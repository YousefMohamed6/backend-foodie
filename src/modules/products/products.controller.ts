import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import * as Prisma from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CategoryViewQueryDto } from './dto/category-view-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { FindAllProductsQueryDto } from './dto/find-all-products-query.dto';
import { UpdateProductRatingsDto } from './dto/update-product-ratings.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.VENDOR)
  @ApiOperation({ summary: 'Create a new product' })
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: Prisma.User,
  ) {
    return this.productsService.create(createProductDto, user);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all products' })
  @ApiQuery({ name: 'vendorId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'publish', required: false, type: Boolean })
  @ApiQuery({
    name: 'foodType',
    required: false,
    enum: ['TakeAway', 'DineIn'],
    description: 'Filter by food type',
  })
  findAll(
    @Query() query: FindAllProductsQueryDto,
    @CurrentUser() user?: Prisma.User,
  ) {
    return this.productsService.findAll(query, user);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  search(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: Prisma.User,
  ) {
    return this.productsService.search(query, page, limit, user);
  }


  @Get('customer/filter')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Get products by category filtered by customer zone',
  })
  @ApiQuery({ name: 'categoryId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getFilteredProducts(
    @Query('categoryId') categoryId: string,
    @CurrentUser() user: Prisma.User,
    @Query() query: CategoryViewQueryDto,
  ) {
    return this.productsService.findByCategoryAndZone(
      categoryId,
      user,
      query.page,
      query.limit,
      query.search,
    );
  }

  @Get('category/:categoryId/discovery')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.CUSTOMER)
  @ApiOperation({
    summary: 'Get products and available categories in the user zone',
  })
  getCategoryDiscovery(
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: Prisma.User,
    @Query() query: CategoryViewQueryDto,
  ) {
    return this.productsService.getCategoryViewData(
      categoryId,
      user,
      query.page,
      query.limit,
      query.search,
    );
  }

  @Get('offers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.CUSTOMER)
  @ApiOperation({
    summary:
      'Get product offers (>= 20% discount and has reviews) in customer zone',
  })
  getOffers(@CurrentUser() user: Prisma.User) {
    return this.productsService.findOffers(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.VENDOR)
  @ApiOperation({ summary: 'Update a product' })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: Prisma.User,
  ) {
    return this.productsService.update(id, updateProductDto, user);
  }

  @Patch(':id/ratings')
  @ApiOperation({ summary: 'Update product ratings statistics' })
  updateRatings(
    @Param('id') id: string,
    @Body() dto: UpdateProductRatingsDto,
  ) {
    return this.productsService.updateRatings(
      id,
      dto.reviewsSum,
      dto.reviewsCount,
    );
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Prisma.UserRole.VENDOR)
  @ApiOperation({ summary: 'Delete a product' })
  remove(@Param('id') id: string, @CurrentUser() user: Prisma.User) {
    return this.productsService.remove(id, user);
  }
}
