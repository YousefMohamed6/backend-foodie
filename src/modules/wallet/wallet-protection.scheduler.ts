import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SettingsService } from '../settings/settings.service';
import { WalletProtectionService } from './wallet-protection.service';

@Injectable()
export class WalletProtectionScheduler {
  private readonly logger = new Logger(WalletProtectionScheduler.name);

  constructor(
    private walletProtectionService: WalletProtectionService,
    private settingsService: SettingsService,
  ) {}

  /**
   * Run every hour to process auto-releases for orders past their timeout period
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processAutoReleases() {
    this.logger.log('🕐 Starting wallet protection auto-release job...');

    try {
      // Check if auto-release is enabled
      const isEnabled = await this.settingsService
        .findOne('wallet_auto_release_enabled')
        .catch(() => 'true');

      if (isEnabled !== 'true') {
        this.logger.log('Auto-release is disabled. Skipping.');
        return;
      }

      const count = await this.walletProtectionService.processAutoReleases();
      this.logger.log(`Auto-release job completed. Released ${count} orders.`);
    } catch (error) {
      this.logger.error('Auto-release job failed:', error);
    }
  }

  /**
   * Run daily at midnight to generate dispute reports
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDisputeReport() {
    this.logger.log('Generating daily dispute report...');
    // Future: Generate summary of pending disputes, escalations, etc.
  }
}
