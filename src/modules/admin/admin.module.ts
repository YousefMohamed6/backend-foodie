import { Module } from '@nestjs/common';
import { DriversModule } from '../drivers/drivers.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [DriversModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
