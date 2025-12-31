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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { User } from '@prisma/client';
import { UserRole } from '@prisma/client';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';

@ApiTags('Vendors')
@ApiBearerAuth()
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new vendor profile' })
  create(@Body() createVendorDto: CreateVendorDto, @CurrentUser() user: User) {
    return this.vendorsService.create(createVendorDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get('nearest')
  @ApiOperation({ summary: 'Get nearest vendors' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Radius in kilometers' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'isDining', required: false, type: Boolean, description: 'Filter by dine-in availability' })
  findNearest(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
    @Query('categoryId') categoryId?: string,
    @Query('isDining') isDining?: boolean,
  ) {
    return this.vendorsService.findNearest(
      latitude,
      longitude,
      radius,
      isDining,
      categoryId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vendor by ID' })
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get vendor products' })
  getProducts(@Param('id') id: string) {
    return this.vendorsService.getProducts(id);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get vendor reviews' })
  getReviews(@Param('id') id: string) {
    return this.vendorsService.getReviews(id);
  }

  @Get(':id/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get vendor orders' })
  getOrders(@Param('id') id: string, @Query() query) {
    return this.vendorsService.getOrders(id, query);
  }

  @Get(':id/coupons')
  @ApiOperation({ summary: 'Get vendor coupons' })
  getCoupons(@Param('id') id: string) {
    return this.vendorsService.getCoupons(id);
  }

  @Get(':id/review-attributes')
  @ApiOperation({ summary: 'Get vendor review attributes' })
  getReviewAttributes(@Param('id') id: string) {
    return this.vendorsService.getReviewAttributes(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a vendor profile' })
  update(@Param('id') id: string, @Body() updateVendorDto: UpdateVendorDto) {
    return this.vendorsService.update(id, updateVendorDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a vendor' })
  remove(@Param('id') id: string) {
    return this.vendorsService.remove(id);
  }
}
