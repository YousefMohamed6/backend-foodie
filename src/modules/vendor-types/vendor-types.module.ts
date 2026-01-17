import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { VendorTypesSeederService } from './vendor-types-seeder.service';
import { VendorTypesController } from './vendor-types.controller';
import { VendorTypesService } from './vendor-types.service';

@Module({
  imports: [PrismaModule],
  controllers: [VendorTypesController],
  providers: [VendorTypesService, VendorTypesSeederService],
  exports: [VendorTypesService],
})
export class VendorTypesModule { }
