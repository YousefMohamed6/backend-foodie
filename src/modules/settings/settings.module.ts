import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsController } from './settings.controller';
import { SettingsGateway } from './settings.gateway';
import { SettingsService } from './settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsGateway],
  exports: [SettingsService],
})
export class SettingsModule { }
