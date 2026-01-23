import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole, VendorType } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';
import { UpdateVendorTypeDto } from './dto/update-vendor-type.dto';
import { VendorTypesService } from './vendor-types.service';

@ApiTags('Vendor Types')
@Controller('vendor-types')
export class VendorTypesController {
  constructor(private readonly vendorTypesService: VendorTypesService) { }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a vendor type (Admin only)' })
  async create(
    @Body() createVendorTypeDto: CreateVendorTypeDto,
  ): Promise<VendorType> {
    return this.vendorTypesService.create(createVendorTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active vendor types' })
  @ApiQuery({
    name: 'showOnHome',
    required: false,
    type: Boolean,
    description: 'Filter vendor types shown on homepage',
  })
  async findAll(): Promise<VendorType[]> {
    return this.vendorTypesService.findAll();
  }

  @Get('customer/home')
  @ApiOperation({ summary: 'Get vendor types for customer homepage' })
  async findForCustomer(): Promise<VendorType[]> {
    return this.vendorTypesService.findAll();
  }

  @Get('admin')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all vendor types including inactive (Admin only)' })
  async findAllAdmin(): Promise<VendorType[]> {
    return this.vendorTypesService.findAllAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vendor type by ID' })
  async findOne(@Param('id') id: string): Promise<VendorType> {
    return this.vendorTypesService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a vendor type (Admin only)' })
  async update(
    @Param('id') id: string,
    @Body() updateVendorTypeDto: UpdateVendorTypeDto,
  ): Promise<VendorType> {
    return this.vendorTypesService.update(id, updateVendorTypeDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a vendor type (Admin only)' })
  async remove(@Param('id') id: string): Promise<VendorType> {
    return this.vendorTypesService.remove(id);
  }
}
