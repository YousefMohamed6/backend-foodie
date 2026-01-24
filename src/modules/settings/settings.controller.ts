import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  // Specific routes must come BEFORE generic routes
  @Get('app')
  @ApiOperation({ summary: 'Get public app settings' })
  async getAppSettings() {
    const settings = await this.settingsService.getPublicSettings();
    return settings;
  }

  @Get('delivery')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get delivery charge settings' })
  async getDeliveryCharge() {
    const settings = await this.settingsService.getDeliverySettings();
    return settings;
  }

  // Generic routes come AFTER specific routes
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all settings (Admin only)' })
  findAll() {
    return this.settingsService.findAll();
  }

  @Patch()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update settings (Admin only)' })
  update(@Body() settings: Record<string, string>) {
    return this.settingsService.updateMany(settings);
  }
}
