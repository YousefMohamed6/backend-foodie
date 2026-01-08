import {
    Controller,
    Get,
    HttpException,
    HttpStatus,
    Logger,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AnalyticsQueryService } from './analytics-query.service';
import { AnalyticsTrackingService } from './analytics-tracking.service';
import {
    GetPerformanceQueryDto,
    GetReportQueryDto,
    GetTopDriversQueryDto,
    GetTopProductsQueryDto,
    GetTopVendorsQueryDto
} from './dto/analytics.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
    private readonly logger = new Logger(AnalyticsController.name);

    constructor(
        private readonly analyticsQuery: AnalyticsQueryService,
        private readonly analyticsTracking: AnalyticsTrackingService,
    ) { }

    @ApiOperation({ summary: 'Get vendor performance metrics' })
    @ApiParam({ name: 'id', description: 'Vendor ID' })
    @ApiResponse({ status: 200 })
    @Get('vendors/:id/performance')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VENDOR)
    async getVendorPerformance(
        @Param('id') vendorId: string,
        @Query() query: GetPerformanceQueryDto,
    ) {
        try {
            return await this.analyticsQuery.getVendorPerformance(
                vendorId,
                query.days,
            );
        } catch (error) {
            this.logger.error(`Failed to get vendor performance: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve vendor performance',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get driver performance metrics' })
    @ApiParam({ name: 'id', description: 'Driver ID' })
    @ApiResponse({ status: 200 })
    @Get('drivers/:id/performance')
    @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DRIVER)
    async getDriverPerformance(
        @Param('id') driverId: string,
        @Query() query: GetPerformanceQueryDto,
    ) {
        try {
            return await this.analyticsQuery.getDriverPerformance(
                driverId,
                query.days,
            );
        } catch (error) {
            this.logger.error(`Failed to get driver performance: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve driver performance',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get customer segments' })
    @Get('customers/segments')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getCustomerSegments() {
        try {
            return await this.analyticsQuery.getCustomerSegments();
        } catch (error) {
            this.logger.error(`Failed to get customer segments: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve customer segments',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get platform health summary' })
    @ApiResponse({ status: 200 })
    @Get('platform/summary')
    @Roles(UserRole.ADMIN)
    async getPlatformSummary() {
        try {
            const result = await this.analyticsQuery.getPlatformHealth();
            if (!result) {
                throw new HttpException(
                    'No platform data available',
                    HttpStatus.NOT_FOUND,
                );
            }
            return result;
        } catch (error) {
            this.logger.error(`Failed to get platform summary: ${error.message}`);
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                'Failed to retrieve platform summary',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get order funnel analytics' })
    @Get('orders/funnel')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getOrderFunnel(@Query() query: GetPerformanceQueryDto) {
        try {
            return await this.analyticsQuery.getOrderFunnelAnalytics(query.days);
        } catch (error) {
            this.logger.error(`Failed to get order funnel: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve order funnel',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get average timing for order event type' })
    @ApiParam({ name: 'eventType', description: 'Order event type' })
    @Get('orders/timing/:eventType')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getOrderTiming(
        @Param('eventType') eventType: string,
        @Query() query: GetPerformanceQueryDto,
    ) {
        try {
            return await this.analyticsTracking.getAverageOrderTiming(
                eventType,
                query.days,
            );
        } catch (error) {
            this.logger.error(`Failed to get order timing: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve order timing',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get payment analytics' })
    @Get('payments/stats')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getPaymentStats(@Query() query: GetPerformanceQueryDto) {
        try {
            return await this.analyticsQuery.getPaymentAnalytics(query.days);
        } catch (error) {
            this.logger.error(`Failed to get payment stats: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve payment statistics',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get payment success rate' })
    @Get('payments/success-rate')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getPaymentSuccessRate(@Query() query: GetPerformanceQueryDto) {
        try {
            return await this.analyticsTracking.getPaymentSuccessRate(query.days);
        } catch (error) {
            this.logger.error(`Failed to get payment success rate: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve payment success rate',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get top performing vendors' })
    @Get('vendors/top')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getTopVendors(@Query() query: GetTopVendorsQueryDto) {
        try {
            return await this.analyticsQuery.getTopVendors(
                query.limit,
                query.sortBy,
            );
        } catch (error) {
            this.logger.error(`Failed to get top vendors: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve top vendors',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get top performing drivers' })
    @Get('drivers/top')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getTopDrivers(@Query() query: GetTopDriversQueryDto) {
        try {
            return await this.analyticsQuery.getTopDrivers(
                query.limit,
                query.sortBy,
            );
        } catch (error) {
            this.logger.error(`Failed to get top drivers: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve top drivers',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get top selling products' })
    @Get('products/top')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getTopProducts(@Query() query: GetTopProductsQueryDto) {
        try {
            return await this.analyticsQuery.getTopProducts(query.limit);
        } catch (error) {
            this.logger.error(`Failed to get top products: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve top products',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get zone performance metrics' })
    @ApiParam({ name: 'id', description: 'Zone ID' })
    @Get('zones/:id/performance')
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    async getZonePerformance(@Param('id') zoneId: string) {
        try {
            const result = await this.analyticsQuery.getZonePerformance(zoneId);
            if (!result) {
                throw new HttpException(
                    'No data available for this zone',
                    HttpStatus.NOT_FOUND,
                );
            }
            return result;
        } catch (error) {
            this.logger.error(`Failed to get zone performance: ${error.message}`);
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                'Failed to retrieve zone performance',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get complete vendor dashboard data' })
    @ApiParam({ name: 'id', description: 'Vendor ID' })
    @Get('dashboard/vendor/:id')
    @Roles(UserRole.ADMIN, UserRole.VENDOR)
    async getVendorDashboard(
        @Param('id') vendorId: string,
        @Query() query: GetPerformanceQueryDto,
    ) {
        try {
            const [performance, products] = await Promise.all([
                this.analyticsQuery.getVendorPerformance(vendorId, query.days),
                this.analyticsQuery.getTopProducts(10),
            ]);

            return {
                performance,
                topProducts: products.filter((p) => p.vendorId === vendorId),
            };
        } catch (error) {
            this.logger.error(`Failed to get vendor dashboard: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve vendor dashboard',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get complete driver dashboard data' })
    @ApiParam({ name: 'id', description: 'Driver ID' })
    @Get('dashboard/driver/:id')
    @Roles(UserRole.ADMIN, UserRole.DRIVER)
    async getDriverDashboard(
        @Param('id') driverId: string,
        @Query() query: GetPerformanceQueryDto,
    ) {
        try {
            return await this.analyticsQuery.getDriverPerformance(
                driverId,
                query.days,
            );
        } catch (error) {
            this.logger.error(`Failed to get driver dashboard: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve driver dashboard',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get complete admin dashboard data' })
    @Get('dashboard/admin')
    @Roles(UserRole.ADMIN)
    async getAdminDashboard(@Query() query: GetPerformanceQueryDto) {
        try {
            const [
                platformHealth,
                orderFunnel,
                paymentStats,
                topVendors,
                topDrivers,
                topProducts,
                customerSegments,
            ] = await Promise.all([
                this.analyticsQuery.getPlatformHealth(),
                this.analyticsQuery.getOrderFunnelAnalytics(query.days),
                this.analyticsQuery.getPaymentAnalytics(query.days),
                this.analyticsQuery.getTopVendors(10),
                this.analyticsQuery.getTopDrivers(10),
                this.analyticsQuery.getTopProducts(20),
                this.analyticsQuery.getCustomerSegments(),
            ]);

            return {
                platformHealth,
                orderFunnel,
                paymentStats,
                topVendors,
                topDrivers,
                topProducts,
                customerSegments: customerSegments.summary,
            };
        } catch (error) {
            this.logger.error(`Failed to get admin dashboard: ${error.message}`);
            throw new HttpException(
                'Failed to retrieve admin dashboard',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get detailed vendor report' })
    @ApiParam({ name: 'id', description: 'Vendor ID' })
    @Get('reports/vendor/:id')
    @Roles(UserRole.ADMIN, UserRole.VENDOR)
    async getVendorReport(
        @Param('id') vendorId: string,
        @Query() query: GetReportQueryDto,
    ) {
        try {
            const start = query.startDate
                ? new Date(query.startDate)
                : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = query.endDate ? new Date(query.endDate) : new Date();

            const orderFunnel = await this.analyticsTracking.getOrderFunnel(
                start,
                end,
            );

            return {
                vendorId,
                period: { start, end },
                orderFunnel,
            };
        } catch (error) {
            this.logger.error(`Failed to get vendor report: ${error.message}`);
            throw new HttpException(
                'Failed to generate vendor report',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Get detailed driver report' })
    @ApiParam({ name: 'id', description: 'Driver ID' })
    @Get('reports/driver/:id')
    @Roles(UserRole.ADMIN, UserRole.DRIVER)
    async getDriverReport(
        @Param('id') driverId: string,
        @Query() query: GetPerformanceQueryDto,
    ) {
        try {
            return await this.analyticsQuery.getDriverPerformance(
                driverId,
                query.days,
            );
        } catch (error) {
            this.logger.error(`Failed to get driver report: ${error.message}`);
            throw new HttpException(
                'Failed to generate driver report',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @ApiOperation({ summary: 'Check analytics system health' })
    @Get('health-check')
    @Roles(UserRole.ADMIN)
    async healthCheck() {
        try {
            const [recentEvents, platformHealth] = await Promise.all([
                this.analyticsTracking.getOrderFunnel(
                    new Date(Date.now() - 24 * 60 * 60 * 1000),
                    new Date(),
                ),
                this.analyticsQuery.getPlatformHealth(),
            ]);

            return {
                status: 'healthy',
                analytics: {
                    orderEventsLast24h: Object.values(recentEvents).reduce(
                        (a: number, b: number) => a + b,
                        0,
                    ),
                    platformDataAvailable: !!platformHealth,
                },
                timestamp: new Date(),
            };
        } catch (error) {
            this.logger.error(`Health check failed: ${error.message}`);
            return {
                status: 'degraded',
                error: error.message,
                timestamp: new Date(),
            };
        }
    }
}
