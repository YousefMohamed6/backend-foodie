import { Injectable, OnModuleInit } from '@nestjs/common';
import { APP_SETTINGS } from './settings.constants';
import { SettingsService } from './settings.service';

@Injectable()
export class SettingsSeederService implements OnModuleInit {
  constructor(private readonly settingsService: SettingsService) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const defaultSettings = {
      googleMapKey: 'YOUR_GOOGLE_MAP_KEY',
      [APP_SETTINGS.REFERRAL_ENABLED]: 'true',
      [APP_SETTINGS.REFERRAL_AMOUNT]: '10',
      RestaurantNearBy: JSON.stringify({
        radius: '10',
        distanceType: 'km',
      }),
      restaurant: JSON.stringify({
        subscription_model: 'true',
      }),
      globalSettings: JSON.stringify({
        isEnableAdsFeature: 'true',
        isSelfDeliveryFeature: 'false',
        placeholderImage: 'https://via.placeholder.com/150',
      }),
      adminCommission: '15',
      adminCommissionType: 'percent',
    };

    for (const [key, value] of Object.entries(defaultSettings)) {
      try {
        await this.settingsService.findOne(key);
      } catch (error) {
        // If not found, create it
        await this.settingsService.update(key, value);
      }
    }
  }
}
