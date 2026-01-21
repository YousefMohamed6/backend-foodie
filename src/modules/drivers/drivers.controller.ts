import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type User, UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverStatusDto } from './dto/update-driver-status.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { UploadDriverDocumentDto } from './dto/upload-driver-document.dto';
import { VerifyDriverDocumentDto } from './dto/verify-driver-document.dto';

@ApiTags('Drivers')
@ApiBearerAuth()
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Create driver profile' })
  create(@Body() createDriverDto: CreateDriverDto, @CurrentUser() user: User) {
    return this.driversService.create(createDriverDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all drivers' })
  findAll() {
    return this.driversService.findAll();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get current driver profile' })
  async getProfile(@CurrentUser() user: User) {
    return this.driversService.findByUser(user.id);
  }

  @Get('available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Find available drivers' })
  findAvailable() {
    return this.driversService.findAvailable();
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get assigned orders for current driver' })
  getOrders(@CurrentUser() user: User, @Query() query) {
    return this.driversService.getOrders(user.id, query);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get current status' })
  getStatus(@CurrentUser() user: User) {
    return this.driversService.getStatus(user.id);
  }

  @Patch('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Update status' })
  updateStatus(@CurrentUser() user: User, @Body() dto: UpdateDriverStatusDto) {
    return this.driversService.updateStatus(
      user.id,
      dto.status,
      dto.isOnline,
      dto.latitude,
      dto.longitude,
    );
  }

  @Get('earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get driver earnings' })
  getEarnings(
    @CurrentUser() user: User,
    @Query('period') period?: 'daily' | 'monthly' | 'yearly',
    @Query('type') type?: 'daily' | 'monthly' | 'yearly',
    @Query('startDate') startDate?: string,
    @Query('date') date?: string,
  ) {
    const finalPeriod = period || type || 'daily';
    const finalDateStr = startDate || date || new Date().toISOString();
    const finalDate = new Date(finalDateStr);

    return this.driversService.getEarnings(user.id, finalPeriod, finalDate);
  }

  @Get('me/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get current driver documents' })
  getDocuments(@CurrentUser() user: User) {
    return this.driversService.getDocuments(user.id);
  }

  @Post('me/documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Upload driver document' })
  uploadDocument(
    @CurrentUser() user: User,
    @Body() data: UploadDriverDocumentDto,
  ) {
    return this.driversService.uploadDocument(user.id, data);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get driver by ID' })
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update driver (Admin)' })
  update(@Param('id') id: string, @Body() updateDriverDto: UpdateDriverDto) {
    return this.driversService.update(id, updateDriverDto);
  }

  @Patch('profile/update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Update current driver status/location' })
  async updateProfile(
    @Body() updateDriverDto: UpdateDriverDto,
    @CurrentUser() user: User,
  ) {
    const driver = await this.driversService.findByUser(user.id);
    if (!driver) {
      // Should create first? Or throw error
      throw new NotFoundException('DRIVER_PROFILE_NOT_FOUND');
    }
    return this.driversService.update(driver.id, updateDriverDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete driver' })
  remove(@Param('id') id: string) {
    return this.driversService.remove(id);
  }

  @Post('documents/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Verify driver document (Admin only)' })
  verifyDocument(@Body() dto: VerifyDriverDocumentDto) {
    return this.driversService.verifyDocument(dto);
  }
}
