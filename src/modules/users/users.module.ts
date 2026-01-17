import { Module, forwardRef } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { VendorsModule } from '../vendors/vendors.module';
import { WalletModule } from '../wallet/wallet.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [WalletModule, SettingsModule, forwardRef(() => VendorsModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
