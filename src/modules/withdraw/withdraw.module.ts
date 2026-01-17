
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { PayoutAccountController } from './payout-account.controller';
import { PayoutAccountService } from './payout-account.service';
import { WithdrawController } from './withdraw.controller';
import { WithdrawService } from './withdraw.service';

@Module({
    imports: [PrismaModule, WalletModule],
    controllers: [WithdrawController, PayoutAccountController],
    providers: [WithdrawService, PayoutAccountService],
})
export class WithdrawModule { }
