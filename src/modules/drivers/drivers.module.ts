import { Module, forwardRef } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { DriversController } from './drivers.controller';
import { DriversGateway } from './drivers.gateway';
import { DriversService } from './drivers.service';

@Module({
  imports: [forwardRef(() => OrdersModule), UsersModule],
  controllers: [DriversController],
  providers: [DriversService, DriversGateway],
  exports: [DriversService],
})
export class DriversModule {}
