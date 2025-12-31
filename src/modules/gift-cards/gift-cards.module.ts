import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { GiftCardsController } from './gift-cards.controller';
import { GiftCardsService } from './gift-cards.service';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [GiftCardsController],
  providers: [GiftCardsService],
  exports: [GiftCardsService],
})
export class GiftCardsModule {}
