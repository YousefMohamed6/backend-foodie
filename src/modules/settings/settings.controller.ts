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
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
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

  @Get('about')
  @ApiOperation({ summary: 'Get about us content' })
  getAbout() {
    return this.settingsService.findOne('about_us');
  }

  @Get('terms')
  @ApiOperation({ summary: 'Get terms and conditions' })
  getTerms() {
    return this.settingsService.findOne('terms_and_conditions');
  }

  @Get('privacy')
  @ApiOperation({ summary: 'Get privacy policy' })
  getPrivacy() {
    return this.settingsService.findOne('privacy_policy');
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Get wallet settings' })
  async getWalletSettings() {
    try {
      const setting = await this.settingsService.findOne('walletSettings');
      return JSON.parse(setting);
    } catch {
      return {};
    }
  }

  @Get('cod')
  @ApiOperation({ summary: 'Get COD settings' })
  async getCODSettings() {
    try {
      const setting = await this.settingsService.findOne('CODSettings');
      return JSON.parse(setting);
    } catch {
      return {};
    }
  }

  @Get('delivery')
  @ApiOperation({ summary: 'Get delivery charge settings' })
  async getDeliveryCharge() {
    try {
      const setting = await this.settingsService.findOne('DeliveryCharge');
      return JSON.parse(setting);
    } catch {
      return {};
    }
  }

  @Get('restaurant')
  @ApiOperation({ summary: 'Get restaurant settings' })
  async getRestaurantSettings() {
    try {
      const setting = await this.settingsService.findOne('restaurant');
      return JSON.parse(setting);
    } catch {
      return {};
    }
  }
}
