import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { VendorsModule } from '../vendors/vendors.module';
import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';
import { SupportService } from './support.service';

@Module({
  imports: [PrismaModule, VendorsModule],
  controllers: [SupportController],
  providers: [SupportService, SupportGateway],
  exports: [SupportService, SupportGateway],
})
export class SupportModule { }

