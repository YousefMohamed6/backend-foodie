import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SettingsSeederService } from './settings-seeder.service';
import { SettingsController } from './settings.controller';
import { SettingsGateway } from './settings.gateway';
import { SettingsService } from './settings.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [
    SettingsService,
    SettingsSeederService,
    SettingsGateway,
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
