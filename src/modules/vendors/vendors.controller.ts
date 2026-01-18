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
import { UserRole, type User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { FindNearestVendorsDto } from './dto/find-nearest-vendors.dto';
import { UpdateVendorDocumentDto } from './dto/update-vendor-document.dto';
import { UpdateVendorScheduleDto } from './dto/update-vendor-schedule.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VerifyVendorDocumentDto } from './dto/verify-vendor-document.dto';
import { VendorsService } from './vendors.service';

@ApiTags('Vendors')
@ApiBearerAuth()
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new vendor profile' })
  create(
    @Body() createVendorDto: CreateVendorDto,
    @CurrentUser() user: User,
  ) {
    return this.vendorsService.create(createVendorDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'zoneId', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('zoneId') zoneId?: string,
    @CurrentUser() user?: User,
  ) {
    return this.vendorsService.findAll({ page, limit, zoneId }, user);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search vendors' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  search(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: User,
  ) {
    return this.vendorsService.search(query, page, limit, user);
  }

  @Get('nearest')
  @ApiOperation({ summary: 'Get nearest vendors' })
  @ApiQuery({ name: 'latitude', required: true, type: Number })
  @ApiQuery({ name: 'longitude', required: true, type: Number })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Radius in kilometers',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'isDining',
    required: false,
    type: Boolean,
    description: 'Filter by dine-in availability',
  })
  findNearest(
    @Query() dto: FindNearestVendorsDto,
    @CurrentUser() user?: User,
  ) {
    return this.vendorsService.findNearest(
      dto.latitude,
      dto.longitude,
      dto.radius,
      dto.isDining,
      dto.categoryId,
      user,
    );
  }

  @Get('documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get vendor documents' })
  getDocuments(@CurrentUser() user: User) {
    return this.vendorsService.getDocuments(user);
  }

  @Post('documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Update or upload vendor documents' })
  updateDocument(
    @Body() dto: UpdateVendorDocumentDto,
    @CurrentUser() user: User,
  ) {
    return this.vendorsService.updateDocument(user, dto);
  }

  @Post('documents/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Verify vendor document (Admin only)' })
  verifyDocument(@Body() dto: VerifyVendorDocumentDto) {
    return this.vendorsService.verifyDocument(dto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a vendor by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.vendorsService.findOne(id, user);
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
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get vendor coupons' })
  getCoupons(@Param('id') id: string, @CurrentUser() user?: User) {
    return this.vendorsService.getCoupons(id, user);
  }

  @Get(':id/schedules')
  @ApiOperation({ summary: 'Get vendor working hours' })
  getSchedules(@Param('id') id: string) {
    return this.vendorsService.getSchedules(id);
  }

  @Patch(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update vendor working hours' })
  updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateVendorScheduleDto,
    @CurrentUser() user: User,
  ) {
    return this.vendorsService.updateSchedule(id, dto, user);
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
