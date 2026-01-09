import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MarsoulController } from './marsoul.controller';
import { MarsoulService } from './marsoul.service';

@Module({
  imports: [PrismaModule],
  controllers: [MarsoulController],
  providers: [MarsoulService],
})
export class MarsoulModule {}
