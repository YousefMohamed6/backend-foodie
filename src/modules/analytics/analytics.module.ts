import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SharedModule } from '../../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsAggregationService } from './analytics-aggregation.service';
import { AnalyticsEventsService } from './analytics-events.service';
import { AnalyticsQueryService } from './analytics-query.service';
import { AnalyticsTrackingService } from './analytics-tracking.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsGateway } from './analytics.gateway';

@Module({
    imports: [
        PrismaModule,
        SharedModule,
        AuthModule,
        // JwtModule is already registered globally in AuthModule
        // EventEmitter and Schedule are registered globally in AppModule
    ],
    providers: [
        AnalyticsTrackingService,
        AnalyticsEventsService,
        AnalyticsAggregationService,
        AnalyticsQueryService,
        AnalyticsGateway,
    ],
    controllers: [AnalyticsController],
    exports: [AnalyticsTrackingService, AnalyticsQueryService],
})
export class AnalyticsModule { }
