
import {
    Body,
    Controller,
    Delete,
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
import { CreatePayoutAccountDto, UpdatePayoutAccountDto } from './dto/payout-account.dto';
import { PayoutAccountService } from './payout-account.service';

@ApiTags('Withdraw - Payout Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('withdraw/accounts')
export class PayoutAccountController {
    constructor(private readonly service: PayoutAccountService) { }

    @Post()
    @Throttle({ default: { ttl: 60000, limit: 2 } }) // 2 requests per minute
    @Roles(UserRole.VENDOR, UserRole.DRIVER, UserRole.MANAGER)
    @ApiOperation({ summary: 'Add a new payout account detail' })
    create(@Request() req, @Body() dto: CreatePayoutAccountDto) {
        return this.service.create(req.user.id, dto);
    }

    @Get()
    @Roles(UserRole.VENDOR, UserRole.DRIVER, UserRole.MANAGER)
    @ApiOperation({ summary: 'Get all my payout accounts' })
    findAll(@Request() req) {
        return this.service.findAll(req.user.id);
    }

    @Patch(':id')
    @Throttle({ default: { ttl: 60000, limit: 2 } })
    @Roles(UserRole.VENDOR, UserRole.DRIVER, UserRole.MANAGER)
    @ApiOperation({ summary: 'Update a payout account' })
    update(
        @Param('id') id: string,
        @Request() req,
        @Body() dto: UpdatePayoutAccountDto,
    ) {
        return this.service.update(id, req.user.id, dto);
    }

    @Delete(':id')
    @Throttle({ default: { ttl: 60000, limit: 2 } })
    @Roles(UserRole.VENDOR, UserRole.DRIVER, UserRole.MANAGER)
    @ApiOperation({ summary: 'Delete a payout account' })
    remove(@Param('id') id: string, @Request() req) {
        return this.service.remove(id, req.user.id);
    }
}
