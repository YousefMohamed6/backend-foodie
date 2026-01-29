import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZonesModule } from '../zones/zones.module';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';

@Module({
  imports: [ConfigModule, ZonesModule],
  controllers: [MapsController],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule { }
