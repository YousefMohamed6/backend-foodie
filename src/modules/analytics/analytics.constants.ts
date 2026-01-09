/**
 * Analytics Constants & Event Types
 * Centralized configuration for all analytics tracking
 */

// ============================================================================
// ORDER LIFECYCLE EVENT TYPES
// ============================================================================
export enum OrderLifecycleEventType {
  // Initial state
  PLACED = 'PLACED',

  // Vendor actions
  VENDOR_ACCEPTED = 'VENDOR_ACCEPTED',
  VENDOR_REJECTED = 'VENDOR_REJECTED',

  // Driver assignment & actions
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  DRIVER_ACCEPTED = 'DRIVER_ACCEPTED',
  DRIVER_REJECTED = 'DRIVER_REJECTED',

  // Delivery progress
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',

  // Cancellation & issues
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

// ============================================================================
// DELIVERY EVENT TYPES
// ============================================================================
export enum DeliveryEventType {
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED_AT_DESTINATION = 'ARRIVED_AT_DESTINATION',
  DELIVERED = 'DELIVERED',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
}

// ============================================================================
// USER ACTIVITY TYPES
// ============================================================================
export enum UserActivityType {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  SIGNUP = 'SIGNUP',
  PASSWORD_RESET = 'PASSWORD_RESET',

  // Browsing
  SEARCH_VENDOR = 'SEARCH_VENDOR',
  SEARCH_PRODUCT = 'SEARCH_PRODUCT',
  VIEW_VENDOR = 'VIEW_VENDOR',
  VIEW_PRODUCT = 'VIEW_PRODUCT',
  VIEW_CATEGORY = 'VIEW_CATEGORY',

  // Favorites
  ADD_FAVORITE_VENDOR = 'ADD_FAVORITE_VENDOR',
  REMOVE_FAVORITE_VENDOR = 'REMOVE_FAVORITE_VENDOR',
  ADD_FAVORITE_PRODUCT = 'ADD_FAVORITE_PRODUCT',
  REMOVE_FAVORITE_PRODUCT = 'REMOVE_FAVORITE_PRODUCT',

  // Orders
  CREATE_ORDER = 'CREATE_ORDER',
  VIEW_ORDER = 'VIEW_ORDER',
  CANCEL_ORDER = 'CANCEL_ORDER',

  // Reviews
  WRITE_REVIEW = 'WRITE_REVIEW',
  UPDATE_REVIEW = 'UPDATE_REVIEW',

  // Profile
  UPDATE_PROFILE = 'UPDATE_PROFILE',
  CHANGE_LANGUAGE = 'CHANGE_LANGUAGE',

  // Wallet
  VIEW_WALLET = 'VIEW_WALLET',
  WALLET_TOPUP = 'WALLET_TOPUP',

  // Referrals
  VIEW_REFERRAL_CODE = 'VIEW_REFERRAL_CODE',
  APPLY_REFERRAL_CODE = 'APPLY_REFERRAL_CODE',
}

export enum UserActivityCategory {
  AUTH = 'AUTH',
  BROWSE = 'BROWSE',
  ORDER = 'ORDER',
  PROFILE = 'PROFILE',
  PAYMENT = 'PAYMENT',
  SOCIAL = 'SOCIAL',
}

// ============================================================================
// PAYMENT TRANSACTION TYPES
// ============================================================================
export enum PaymentTransactionType {
  ORDER_PAYMENT = 'ORDER_PAYMENT',
  WALLET_TOPUP = 'WALLET_TOPUP',
  SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT',
  WITHDRAWAL = 'WITHDRAWAL',
  REFUND = 'REFUND',
}

export enum PaymentTransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}

// ============================================================================
// SUBSCRIPTION EVENT TYPES
// ============================================================================
export enum SubscriptionEventType {
  SUBSCRIBED = 'SUBSCRIBED',
  RENEWED = 'RENEWED',
  CANCELLED = 'CANCELLED',
  UPGRADED = 'UPGRADED',
  DOWNGRADED = 'DOWNGRADED',
  EXPIRED = 'EXPIRED',
}

// ============================================================================
// ENTITY CHANGE TYPES
// ============================================================================
export enum EntityChangeType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum EntityType {
  ORDER = 'Order',
  PRODUCT = 'Product',
  VENDOR = 'Vendor',
  USER = 'User',
  DRIVER = 'Driver',
  SUBSCRIPTION = 'Subscription',
  PAYMENT = 'Payment',
  REVIEW = 'Review',
  SETTING = 'Setting',
}

// ============================================================================
// SNAPSHOT TYPES
// ============================================================================
export enum SnapshotType {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

// ============================================================================
// RESOURCE TYPES
// ============================================================================
export enum ResourceType {
  VENDOR = 'vendor',
  PRODUCT = 'product',
  ORDER = 'order',
  CATEGORY = 'category',
  REVIEW = 'review',
}

// ============================================================================
// ANALYTICS CONFIGURATION
// ============================================================================
export class AnalyticsConfig {
  // Cache TTL (Time To Live) in seconds
  static readonly CACHE_TTL = {
    VENDOR_RANKINGS: 3600, // 1 hour
    DRIVER_RANKINGS: 3600, // 1 hour
    CUSTOMER_SEGMENTS: 1800, // 30 minutes
    PLATFORM_SUMMARY: 300, // 5 minutes
    ZONE_PERFORMANCE: 1800, // 30 minutes
    PRODUCT_RANKINGS: 3600, // 1 hour
  };

  // Redis cache keys
  static readonly CACHE_KEYS = {
    VENDOR_RANKINGS: 'analytics:vendor:rankings',
    DRIVER_RANKINGS: 'analytics:driver:rankings',
    CUSTOMER_SEGMENTS: 'analytics:customer:segments',
    PLATFORM_SUMMARY: 'analytics:platform:summary',
    ZONE_PERFORMANCE: (zoneId: string) => `analytics:zone:${zoneId}`,
    PRODUCT_RANKINGS: 'analytics:product:rankings',
  };

  // Default query limits
  static readonly DEFAULT_LIMITS = {
    TOP_VENDORS: 10,
    TOP_DRIVERS: 10,
    TOP_PRODUCTS: 20,
    TOP_CUSTOMERS: 50,
    RECENT_ACTIVITIES: 100,
  };

  // Default time ranges (in days)
  static readonly DEFAULT_TIME_RANGES = {
    RECENT: 7,
    MONTHLY: 30,
    QUARTERLY: 90,
    YEARLY: 365,
  };

  // Aggregation job schedules
  static readonly CRON_SCHEDULES = {
    DAILY_AGGREGATION: '0 0 * * *', // Midnight
    WEEKLY_AGGREGATION: '0 1 * * 1', // Monday 1 AM
    MONTHLY_AGGREGATION: '0 2 1 * *', // 1st of month 2 AM
    CACHE_WARMUP: '0 */6 * * *', // Every 6 hours
  };

  // Thresholds for customer segmentation
  static readonly CUSTOMER_SEGMENTATION = {
    VIP_MIN_ORDERS: 10,
    VIP_MIN_SPEND: 1000,
    VIP_MAX_DAYS_SINCE_ORDER: 7,
    ACTIVE_MAX_DAYS_SINCE_ORDER: 30,
    AT_RISK_MIN_DAYS_SINCE_ORDER: 30,
    AT_RISK_MAX_DAYS_SINCE_ORDER: 60,
    CHURNED_MIN_DAYS_SINCE_ORDER: 60,
  };

  // Performance thresholds
  static readonly PERFORMANCE_THRESHOLDS = {
    VENDOR_ACCEPTANCE_TIME_EXCELLENT: 120, // 2 minutes
    VENDOR_ACCEPTANCE_TIME_GOOD: 300, // 5 minutes
    VENDOR_ACCEPTANCE_RATE_EXCELLENT: 95, // 95%
    VENDOR_ACCEPTANCE_RATE_GOOD: 85, // 85%
    DRIVER_DELIVERY_TIME_EXCELLENT: 20, // 20 minutes
    DRIVER_DELIVERY_TIME_GOOD: 30, // 30 minutes
    DRIVER_ACCEPTANCE_RATE_EXCELLENT: 90, // 90%
    DRIVER_ACCEPTANCE_RATE_GOOD: 75, // 75%
    PAYMENT_SUCCESS_RATE_EXCELLENT: 95, // 95%
    PAYMENT_SUCCESS_RATE_GOOD: 85, // 85%
  };

  // Data retention periods (in days)
  static readonly DATA_RETENTION = {
    ORDER_LIFECYCLE_EVENTS: 180, // 6 months
    USER_ACTIVITY_LOGS: 90, // 3 months
    DELIVERY_EVENTS: 180, // 6 months
    PAYMENT_LOGS: 365, // 1 year
    ENTITY_CHANGE_LOGS: 365, // 1 year
    SNAPSHOTS: 730, // 2 years
  };

  // WebSocket event names
  static readonly WS_EVENTS = {
    ORDER_EVENT: 'orderEvent',
    DELIVERY_EVENT: 'deliveryEvent',
    PAYMENT_UPDATE: 'paymentUpdate',
    SUBSCRIPTION_UPDATE: 'subscriptionUpdate',
    METRIC_UPDATE: 'metricUpdate',
    DASHBOARD_STATS: 'dashboardStats',
    VENDOR_RANKINGS: 'vendorRankings',
    DRIVER_RANKINGS: 'driverRankings',
    VENDOR_ORDER_EVENT: 'vendorOrderEvent',
    DRIVER_DELIVERY_EVENT: 'driverDeliveryEvent',
    ADMIN_ORDER_EVENT: 'adminOrderEvent',
    ADMIN_DELIVERY_EVENT: 'adminDeliveryEvent',
    ADMIN_SUBSCRIPTION_UPDATE: 'adminSubscriptionUpdate',
    PLATFORM_METRIC_UPDATE: 'platformMetricUpdate',
    MY_RANKING: 'myRanking',
  };

  // WebSocket rooms
  static readonly WS_ROOMS = {
    ANALYTICS: 'analytics',
    ADMIN: 'admin',
    MANAGER: 'manager',
    PLATFORM_METRICS: 'platform_metrics',
    vendorAnalytics: (vendorId: string) => `vendor_analytics_${vendorId}`,
    driverAnalytics: (driverId: string) => `driver_analytics_${driverId}`,
    manager: (managerId: string) => `manager_${managerId}`,
  };

  // Default currency
  static readonly DEFAULT_CURRENCY = 'EGP';

  // Batch operation sizes
  static readonly BATCH_SIZES = {
    ORDER_LIFECYCLE_EVENTS: 100,
    USER_ACTIVITIES: 500,
    ENTITY_CHANGES: 100,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get activity category from activity type
 */
export function getActivityCategory(
  activityType: UserActivityType,
): UserActivityCategory {
  const authTypes = [
    UserActivityType.LOGIN,
    UserActivityType.LOGOUT,
    UserActivityType.SIGNUP,
    UserActivityType.PASSWORD_RESET,
  ];

  const browseTypes = [
    UserActivityType.SEARCH_VENDOR,
    UserActivityType.SEARCH_PRODUCT,
    UserActivityType.VIEW_VENDOR,
    UserActivityType.VIEW_PRODUCT,
    UserActivityType.VIEW_CATEGORY,
    UserActivityType.ADD_FAVORITE_VENDOR,
    UserActivityType.REMOVE_FAVORITE_VENDOR,
    UserActivityType.ADD_FAVORITE_PRODUCT,
    UserActivityType.REMOVE_FAVORITE_PRODUCT,
  ];

  const orderTypes = [
    UserActivityType.CREATE_ORDER,
    UserActivityType.VIEW_ORDER,
    UserActivityType.CANCEL_ORDER,
  ];

  const profileTypes = [
    UserActivityType.UPDATE_PROFILE,
    UserActivityType.CHANGE_LANGUAGE,
  ];

  const paymentTypes = [
    UserActivityType.VIEW_WALLET,
    UserActivityType.WALLET_TOPUP,
  ];

  const socialTypes = [
    UserActivityType.WRITE_REVIEW,
    UserActivityType.UPDATE_REVIEW,
    UserActivityType.VIEW_REFERRAL_CODE,
    UserActivityType.APPLY_REFERRAL_CODE,
  ];

  if (authTypes.includes(activityType)) return UserActivityCategory.AUTH;
  if (browseTypes.includes(activityType)) return UserActivityCategory.BROWSE;
  if (orderTypes.includes(activityType)) return UserActivityCategory.ORDER;
  if (profileTypes.includes(activityType)) return UserActivityCategory.PROFILE;
  if (paymentTypes.includes(activityType)) return UserActivityCategory.PAYMENT;
  if (socialTypes.includes(activityType)) return UserActivityCategory.SOCIAL;

  return UserActivityCategory.BROWSE; // Default
}

/**
 * Get customer segment based on metrics
 */
export function getCustomerSegment(metrics: {
  daysSinceLastOrder?: number | null;
  totalOrders: number;
  totalSpent: number;
}): 'VIP' | 'ACTIVE' | 'AT_RISK' | 'CHURNED' | 'NEW' {
  const { daysSinceLastOrder, totalOrders, totalSpent } = metrics;
  const config = AnalyticsConfig.CUSTOMER_SEGMENTATION;

  // VIP customers
  if (
    daysSinceLastOrder !== null &&
    daysSinceLastOrder !== undefined &&
    daysSinceLastOrder <= config.VIP_MAX_DAYS_SINCE_ORDER &&
    totalOrders >= config.VIP_MIN_ORDERS &&
    totalSpent >= config.VIP_MIN_SPEND
  ) {
    return 'VIP';
  }

  // Active customers
  if (
    daysSinceLastOrder !== null &&
    daysSinceLastOrder !== undefined &&
    daysSinceLastOrder <= config.ACTIVE_MAX_DAYS_SINCE_ORDER
  ) {
    return 'ACTIVE';
  }

  // At-risk customers
  if (
    daysSinceLastOrder !== null &&
    daysSinceLastOrder !== undefined &&
    daysSinceLastOrder > config.AT_RISK_MIN_DAYS_SINCE_ORDER &&
    daysSinceLastOrder <= config.AT_RISK_MAX_DAYS_SINCE_ORDER
  ) {
    return 'AT_RISK';
  }

  // Churned customers
  if (
    daysSinceLastOrder !== null &&
    daysSinceLastOrder !== undefined &&
    daysSinceLastOrder > config.CHURNED_MIN_DAYS_SINCE_ORDER
  ) {
    return 'CHURNED';
  }

  // New customers (no order yet or very recent)
  return 'NEW';
}

/**
 * Get performance rating based on metric and threshold
 */
export function getPerformanceRating(
  value: number,
  thresholds: { excellent: number; good: number },
  higherIsBetter: boolean = true,
): 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR' {
  if (higherIsBetter) {
    if (value >= thresholds.excellent) return 'EXCELLENT';
    if (value >= thresholds.good) return 'GOOD';
    if (value >= thresholds.good * 0.7) return 'AVERAGE';
    return 'POOR';
  } else {
    // Lower is better (e.g., delivery time)
    if (value <= thresholds.excellent) return 'EXCELLENT';
    if (value <= thresholds.good) return 'GOOD';
    if (value <= thresholds.good * 1.5) return 'AVERAGE';
    return 'POOR';
  }
}
