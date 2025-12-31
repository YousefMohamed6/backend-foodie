import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DineInController } from './dine-in.controller';
import { DineInService } from './dine-in.service';

@Module({
  imports: [PrismaModule],
  controllers: [DineInController],
  providers: [DineInService],
  exports: [DineInService],
})
export class DineInModule {}
