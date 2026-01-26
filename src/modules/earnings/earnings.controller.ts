import {
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole, type User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EarningsService } from './earnings.service';

@ApiTags('Earnings')
@ApiBearerAuth()
@Controller('earnings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EarningsController {
    constructor(private readonly earningsService: EarningsService) { }

    @Get('daily')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VENDOR)
    @ApiOperation({ summary: 'Get daily earnings for vendor/manager' })
    async getDailyEarnings(
        @CurrentUser() user: User,
        @Query('date') dateStr?: string,
    ) {
        try {
            const date = dateStr ? new Date(dateStr) : new Date();
            return await this.earningsService.getDailyEarnings(user, date);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                error.message || 'Failed to retrieve daily earnings',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('monthly')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VENDOR)
    @ApiOperation({ summary: 'Get monthly earnings for vendor/manager' })
    async getMonthlyEarnings(
        @CurrentUser() user: User,
        @Query('date') dateStr?: string,
    ) {
        try {
            const date = dateStr ? new Date(dateStr) : new Date();
            return await this.earningsService.getMonthlyEarnings(user, date);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                error.message || 'Failed to retrieve monthly earnings',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get('yearly')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VENDOR)
    @ApiOperation({ summary: 'Get yearly earnings for vendor/manager' })
    async getYearlyEarnings(
        @CurrentUser() user: User,
        @Query('date') dateStr?: string,
    ) {
        try {
            const date = dateStr ? new Date(dateStr) : new Date();
            return await this.earningsService.getYearlyEarnings(user, date);
        } catch (error) {
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                error.message || 'Failed to retrieve yearly earnings',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
