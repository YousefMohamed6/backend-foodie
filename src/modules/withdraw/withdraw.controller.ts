
import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
    AdminApproveWithdrawDto,
    AdminCompleteWithdrawDto,
    AdminRejectWithdrawDto,
    CreateWithdrawRequestDto,
} from './dto/withdraw.dto';
import { WithdrawService } from './withdraw.service';

@ApiTags('Withdraw')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('withdraw')
export class WithdrawController {
    constructor(private service: WithdrawService) { }

    @Post()
    @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 requests per minute
    @Roles(UserRole.VENDOR, UserRole.DRIVER, UserRole.MANAGER)
    @ApiOperation({ summary: 'Create a withdrawal request' })
    create(@Request() req, @Body() dto: CreateWithdrawRequestDto) {
        return this.service.createRequest(req.user.id, dto);
    }

    @Get('history')
    @Roles(UserRole.VENDOR, UserRole.DRIVER, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get own withdrawal history' })
    getHistory(@Request() req) {
        return this.service.findMyHistory(req.user.id);
    }

    @Get('pending')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all pending withdrawal requests (Admin)' })
    getPending() {
        return this.service.findAllPending();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get a specific withdrawal request (Admin)' })
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id/approve')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Approve a withdrawal request (Admin)' })
    approve(@Param('id') id: string, @Body() dto: AdminApproveWithdrawDto) {
        return this.service.approveRequest(id, dto);
    }

    @Patch(':id/reject')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Reject a withdrawal request (Admin)' })
    reject(@Param('id') id: string, @Body() dto: AdminRejectWithdrawDto) {
        return this.service.rejectRequest(id, dto);
    }

    @Patch(':id/complete')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Complete a withdrawal request and debit wallet (Admin)' })
    complete(@Param('id') id: string, @Body() dto: AdminCompleteWithdrawDto) {
        return this.service.completeRequest(id, dto);
    }
}
