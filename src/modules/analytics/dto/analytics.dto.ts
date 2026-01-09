import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetPerformanceQueryDto {
  @ApiPropertyOptional({
    description: 'Number of days to look back',
    minimum: 1,
    maximum: 365,
    default: 30,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  days?: number = 30;
}

export class GetTopVendorsQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['revenue', 'orders', 'rating'],
    default: 'revenue',
  })
  @IsOptional()
  @IsEnum(['revenue', 'orders', 'rating'])
  sortBy?: 'revenue' | 'orders' | 'rating' = 'revenue';
}

export class GetTopDriversQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['deliveries', 'earnings', 'rating'],
    default: 'deliveries',
  })
  @IsOptional()
  @IsEnum(['deliveries', 'earnings', 'rating'])
  sortBy?: 'deliveries' | 'earnings' | 'rating' = 'deliveries';
}

export class GetTopProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class GetReportQueryDto {
  @ApiPropertyOptional({
    description: 'Start date in ISO format (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date in ISO format (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class GetOrderTimingParamsDto {
  @ApiProperty({
    description: 'Order lifecycle event type',
    example: 'VENDOR_ACCEPTED',
  })
  @IsString()
  eventType: string;
}

// Response DTOs
export class VendorPerformanceResponseDto {
  @ApiProperty()
  vendorId: string;

  @ApiProperty()
  period: string;

  @ApiProperty({ required: false })
  snapshot: any;

  @ApiProperty()
  today: {
    orders: number;
    revenue: number;
  };

  @ApiProperty({ required: false })
  performance: {
    acceptanceRating: string;
    revenueRating: string;
  } | null;
}

export class DriverPerformanceResponseDto {
  @ApiProperty()
  driverId: string;

  @ApiProperty()
  period: string;

  @ApiProperty({ required: false })
  snapshot: any;

  @ApiProperty()
  today: {
    deliveries: number;
  };

  @ApiProperty({ required: false })
  performance: {
    deliveryTimeRating: string;
    ratingScore: number;
  } | null;
}

export class CustomerSegmentsSummaryDto {
  @ApiProperty()
  vip: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  atRisk: number;

  @ApiProperty()
  churned: number;

  @ApiProperty()
  new: number;
}

export class PlatformHealthResponseDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  gmv: number;

  @ApiProperty()
  totalOrders: number;

  @ApiProperty()
  completedOrders: number;

  @ApiProperty()
  cancelledOrders: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty()
  averageOrderValue: number;

  @ApiProperty()
  platformRevenue: number;

  @ApiProperty()
  subscriptionRevenue: number;

  @ApiProperty()
  activeUsers: {
    customers: number;
    vendors: number;
    drivers: number;
  };

  @ApiProperty()
  newSignups: {
    customers: number;
    vendors: number;
    drivers: number;
  };
}
