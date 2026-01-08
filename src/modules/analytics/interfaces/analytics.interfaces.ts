// Analytics Event Interfaces
export interface OrderLifecycleEventData {
    orderId: string;
    eventType: string;
    previousStatus?: string;
    newStatus: string;
    actorId?: string;
    actorRole?: string;
    timeSincePrevious?: number;
    metadata?: any;
    locationLat?: number;
    locationLng?: number;
}

export interface DeliveryEventData {
    orderId: string;
    driverId?: string;
    vendorId: string;
    eventType: string;
    status: string;
    latitude?: number;
    longitude?: number;
    distanceCovered?: number;
    duration?: number;
    averageSpeed?: number;
    metadata?: any;
}

export interface UserActivityData {
    userId: string;
    activityType: string;
    activityCategory: string;
    resourceType?: string;
    resourceId?: string;
    sessionId?: string;
    devicePlatform?: string;
    appVersion?: string;
    latitude?: number;
    longitude?: number;
    metadata?: any;
}

export interface PaymentTransactionData {
    transactionType: string;
    referenceId: string;
    referenceType: string;
    userId: string;
    userRole: string;
    amount: number;
    currency?: string;
    paymentMethod: string;
    paymentGateway?: string;
    status: string;
    previousStatus?: string;
    gatewayTransactionId?: string;
    gatewayResponse?: any;
    errorCode?: string;
    errorMessage?: string;
    completedAt?: Date;
    metadata?: any;
}

export interface SubscriptionEventData {
    subscriptionId: string;
    vendorId?: string;
    userId: string;
    eventType: string;
    previousPlanId?: string;
    newPlanId: string;
    planName: string;
    planPrice: number;
    amountPaid: number;
    paymentMethod?: string;
    paymentStatus?: string;
    startDate: Date;
    endDate: Date;
    metadata?: any;
}

export interface EntityChangeData {
    entityType: string;
    entityId: string;
    changeType: 'CREATE' | 'UPDATE' | 'DELETE';
    actorId?: string;
    actorRole?: string;
    previousValue?: any;
    newValue?: any;
    changedFields?: string[];
    ipAddress?: string;
    userAgent?: string;
}

// Aggregation Interfaces
export interface VendorMetricsData {
    vendorId: string;
    snapshotDate: Date;
    snapshotType: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    vendorRejectedOrders: number;
    totalRevenue: number;
    netRevenue: number;
    commissionPaid: number;
    averageOrderValue: number;
    averageAcceptanceTime?: number;
    acceptanceRate?: number;
    subscriptionPlanId?: string;
    isOnFreePlan: boolean;
    uniqueCustomers: number;
    repeatCustomers: number;
    newCustomers: number;
    activeProducts: number;
    productsOrdered: number;
    totalProductsSold: number;
    totalDiscountsGiven: number;
}

export interface DriverMetricsData {
    driverId: string;
    snapshotDate: Date;
    snapshotType: string;
    totalAssignments: number;
    acceptedAssignments: number;
    rejectedAssignments: number;
    completedDeliveries: number;
    averageDeliveryTime?: number;
    averageRating?: number;
    totalRatings: number;
    totalEarnings: number;
    netEarnings: number;
    commissionPaid: number;
    totalTips: number;
    totalOnlineMinutes?: number;
    totalActiveMinutes?: number;
    totalDistanceKm?: number;
    zoneId?: string;
    uniqueVendors: number;
}

export interface CustomerMetricsData {
    customerId: string;
    snapshotDate: Date;
    snapshotType: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    uniqueVendorsOrdered: number;
    favoriteVendorId?: string;
    preferredCategoryId?: string;
    daysSinceLastOrder?: number;
    orderFrequency?: number;
    referralsGiven: number;
    reviewsWritten: number;
    walletBalance: number;
    walletTopUps: number;
}

export interface PlatformMetricsData {
    summaryDate: Date;
    summaryType: string;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    averageOrderValue: number;
    grossMerchandiseValue: number;
    totalRevenue: number;
    vendorCommissions: number;
    driverCommissions: number;
    platformRevenue: number;
    subscriptionRevenue: number;
    activeCustomers: number;
    activeVendors: number;
    activeDrivers: number;
    newCustomers: number;
    newVendors: number;
    newDrivers: number;
    totalSearches: number;
    totalReviews: number;
}
