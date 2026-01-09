import { Module, forwardRef } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { WalletProtectionScheduler } from './wallet-protection.scheduler';
import { WalletProtectionService } from './wallet-protection.service';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [forwardRef(() => SettingsModule)],
  controllers: [WalletController],
  providers: [
    WalletService,
    WalletProtectionService,
    WalletProtectionScheduler,
  ],
  exports: [WalletService, WalletProtectionService],
})
export class WalletModule {}
