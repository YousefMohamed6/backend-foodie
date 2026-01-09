import { Module } from '@nestjs/common';
import { ManagerAuditController } from './manager-audit.controller';
import { ManagerAuditService } from './manager-audit.service';

@Module({
  controllers: [ManagerAuditController],
  providers: [ManagerAuditService],
  exports: [ManagerAuditService],
})
export class ManagerAuditModule {}
