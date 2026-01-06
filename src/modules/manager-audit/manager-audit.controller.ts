import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ManagerAuditService } from './manager-audit.service';

@ApiTags('Manager Audit Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('manager-audit-logs')
export class ManagerAuditController {
    constructor(private readonly managerAuditService: ManagerAuditService) { }

    @Get()
    @ApiOperation({ summary: 'Get all manager dispatch audit logs (Admin only)' })
    findAll() {
        return this.managerAuditService.findAll();
    }
}
