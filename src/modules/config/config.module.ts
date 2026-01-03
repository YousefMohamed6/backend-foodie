import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfigController } from './config.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ConfigController],
})
export class ConfigModule {}
