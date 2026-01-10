/*
  Warnings:

  - The values [Order Accepted,Order Rejected] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `note` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `zones` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `zones` table. All the data in the column will be lost.
  - Added the required column `arabic_name` to the `zones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `english_name` to the `zones` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CommissionSource" AS ENUM ('vendor', 'driver');

-- CreateEnum
CREATE TYPE "BalanceType" AS ENUM ('payment', 'held', 'released', 'refunded');

-- CreateEnum
CREATE TYPE "DeliveryConfirmationType" AS ENUM ('customer_confirmation', 'otp_confirmed', 'photo_proof', 'timeout_release', 'admin_resolution');

-- CreateEnum
CREATE TYPE "HeldBalanceStatus" AS ENUM ('held', 'released', 'refunded', 'disputed');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('pending', 'under_review', 'resolved_customer_win', 'resolved_driver_win', 'resolved_partial', 'fraud_detected');

-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('Order Placed', 'Vendor Accepted', 'Vendor Rejected', 'Order Cancelled', 'Driver Pending', 'Driver Accepted', 'Driver Rejected', 'Order Shipped', 'In Transit', 'Order Completed');
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'Order Placed';
COMMIT;

-- AlterTable
ALTER TABLE "driver_profiles" ADD COLUMN     "wallet_amount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "driver_commission_applied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "driver_commission_rate" DECIMAL(10,4) NOT NULL DEFAULT 0,
ADD COLUMN     "driver_commission_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "driver_net" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "estimated_ready_at" TIMESTAMP(3),
ADD COLUMN     "is_ready_notification_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "platform_total_commission" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vendor_commission_applied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vendor_commission_rate" DECIMAL(10,4) NOT NULL DEFAULT 0,
ADD COLUMN     "vendor_commission_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vendor_net" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "wallet_transactions" DROP COLUMN "note",
ADD COLUMN     "balance_type" "BalanceType",
ADD COLUMN     "delivery_confirmation_time" TIMESTAMP(3),
ADD COLUMN     "delivery_confirmation_type" "DeliveryConfirmationType",
ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "description_en" TEXT,
ADD COLUMN     "held_balance_id" TEXT,
ADD COLUMN     "resolution_reason" TEXT;

-- AlterTable
ALTER TABLE "zones" DROP COLUMN "is_active",
DROP COLUMN "name",
ADD COLUMN     "arabic_name" TEXT NOT NULL,
ADD COLUMN     "english_name" TEXT NOT NULL,
ADD COLUMN     "is_publish" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "admin_wallets" (
    "id" TEXT NOT NULL,
    "wallet_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "order_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "held_balances" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "driver_id" TEXT,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "vendor_amount" DECIMAL(10,2) NOT NULL,
    "driver_amount" DECIMAL(10,2) NOT NULL,
    "admin_amount" DECIMAL(10,2) NOT NULL,
    "status" "HeldBalanceStatus" NOT NULL DEFAULT 'held',
    "hold_reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMP(3),
    "release_type" "DeliveryConfirmationType",
    "auto_release_date" TIMESTAMP(3),
    "dispute_id" TEXT,

    CONSTRAINT "held_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "driver_id" TEXT,
    "reason" TEXT NOT NULL,
    "customer_evidence" JSONB,
    "driver_response" TEXT,
    "driver_evidence" JSONB,
    "status" "DisputeStatus" NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" TEXT,
    "resolution" TEXT,
    "resolution_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_audit_logs" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_commission_snapshots" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "driver_id" TEXT,
    "source" "CommissionSource" NOT NULL,
    "commission_rate" DECIMAL(10,4) NOT NULL,
    "commission_value" DECIMAL(10,2) NOT NULL,
    "base_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_commission_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_activity_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "activity_category" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "session_id" TEXT,
    "device_platform" "DevicePlatform",
    "app_version" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_metrics_snapshots" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "snapshot_type" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "completedOrders" INTEGER NOT NULL DEFAULT 0,
    "cancelledOrders" INTEGER NOT NULL DEFAULT 0,
    "vendor_rejected_orders" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "commissionPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "averageOrderValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "avg_acceptance_time_seconds" INTEGER,
    "acceptanceRate" DECIMAL(5,2),
    "subscription_plan_id" TEXT,
    "is_on_free_plan" BOOLEAN NOT NULL DEFAULT false,
    "uniqueCustomers" INTEGER NOT NULL DEFAULT 0,
    "repeatCustomers" INTEGER NOT NULL DEFAULT 0,
    "newCustomers" INTEGER NOT NULL DEFAULT 0,
    "activeProducts" INTEGER NOT NULL DEFAULT 0,
    "productsOrdered" INTEGER NOT NULL DEFAULT 0,
    "total_products_sold" INTEGER NOT NULL DEFAULT 0,
    "total_discounts_given" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_metrics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_metrics_snapshots" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "snapshot_type" TEXT NOT NULL,
    "totalAssignments" INTEGER NOT NULL DEFAULT 0,
    "acceptedAssignments" INTEGER NOT NULL DEFAULT 0,
    "rejectedAssignments" INTEGER NOT NULL DEFAULT 0,
    "completedDeliveries" INTEGER NOT NULL DEFAULT 0,
    "avg_delivery_time_minutes" INTEGER,
    "averageRating" DECIMAL(2,1),
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "commissionPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalTips" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_online_minutes" INTEGER,
    "total_active_minutes" INTEGER,
    "total_distance_km" DECIMAL(10,2),
    "zoneId" TEXT,
    "uniqueVendors" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_metrics_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_engagement_metrics" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "snapshot_type" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "completedOrders" INTEGER NOT NULL DEFAULT 0,
    "cancelledOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "averageOrderValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "uniqueVendorsOrdered" INTEGER NOT NULL DEFAULT 0,
    "favorite_vendor_id" TEXT,
    "preferred_category_id" TEXT,
    "days_since_last_order" INTEGER,
    "orderFrequency" DECIMAL(5,2),
    "referralsGiven" INTEGER NOT NULL DEFAULT 0,
    "reviewsWritten" INTEGER NOT NULL DEFAULT 0,
    "walletBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "walletTopUps" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_engagement_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_event_logs" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "previous_plan_id" TEXT,
    "new_plan_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "planPrice" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "eventTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transaction_logs" (
    "id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "reference_type" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_role" "UserRole" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "payment_method" TEXT NOT NULL,
    "payment_gateway" TEXT,
    "status" TEXT NOT NULL,
    "previous_status" TEXT,
    "gateway_transaction_id" TEXT,
    "gateway_response" JSONB,
    "error_code" TEXT,
    "error_message" TEXT,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "payment_transaction_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_metrics_summaries" (
    "id" TEXT NOT NULL,
    "summary_date" TIMESTAMP(3) NOT NULL,
    "summary_type" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "completedOrders" INTEGER NOT NULL DEFAULT 0,
    "cancelledOrders" INTEGER NOT NULL DEFAULT 0,
    "averageOrderValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gmv" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "vendorCommissions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "driverCommissions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "platformRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subscriptionRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activeCustomers" INTEGER NOT NULL DEFAULT 0,
    "activeVendors" INTEGER NOT NULL DEFAULT 0,
    "activeDrivers" INTEGER NOT NULL DEFAULT 0,
    "newCustomers" INTEGER NOT NULL DEFAULT 0,
    "newVendors" INTEGER NOT NULL DEFAULT 0,
    "newDrivers" INTEGER NOT NULL DEFAULT 0,
    "totalSearches" INTEGER NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_metrics_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zone_performance_metrics" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "snapshot_type" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "completedOrders" INTEGER NOT NULL DEFAULT 0,
    "avg_delivery_time_minutes" INTEGER,
    "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "averageOrderValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "activeVendors" INTEGER NOT NULL DEFAULT 0,
    "activeDrivers" INTEGER NOT NULL DEFAULT 0,
    "totalCustomers" INTEGER NOT NULL DEFAULT 0,
    "manager_id" TEXT,
    "totalDriverAssignments" INTEGER NOT NULL DEFAULT 0,
    "cashCollections" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "zone_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_performance_metrics" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "snapshot_type" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalQuantitySold" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "averagePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalDiscountGiven" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "uniqueCustomers" INTEGER NOT NULL DEFAULT 0,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalFavorites" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entity_change_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" "UserRole",
    "previous_value" JSONB,
    "new_value" JSONB,
    "changed_fields" TEXT[],
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entity_change_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_lifecycle_events" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "previous_status" TEXT,
    "new_status" TEXT,
    "actor_id" TEXT,
    "actor_role" "UserRole",
    "time_since_previous" INTEGER,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "metadata" JSONB,
    "event_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_events" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distance_covered" DOUBLE PRECISION,
    "duration" INTEGER,
    "average_speed" DOUBLE PRECISION,
    "metadata" JSONB,
    "event_timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "held_balances_order_id_key" ON "held_balances"("order_id");

-- CreateIndex
CREATE INDEX "dispute_audit_logs_dispute_id_idx" ON "dispute_audit_logs"("dispute_id");

-- CreateIndex
CREATE INDEX "order_commission_snapshots_order_id_idx" ON "order_commission_snapshots"("order_id");

-- CreateIndex
CREATE INDEX "order_commission_snapshots_vendor_id_idx" ON "order_commission_snapshots"("vendor_id");

-- CreateIndex
CREATE INDEX "order_commission_snapshots_driver_id_idx" ON "order_commission_snapshots"("driver_id");

-- CreateIndex
CREATE INDEX "order_commission_snapshots_source_idx" ON "order_commission_snapshots"("source");

-- CreateIndex
CREATE INDEX "order_commission_snapshots_created_at_idx" ON "order_commission_snapshots"("created_at");

-- CreateIndex
CREATE INDEX "user_activity_logs_user_id_idx" ON "user_activity_logs"("user_id");

-- CreateIndex
CREATE INDEX "user_activity_logs_activity_type_idx" ON "user_activity_logs"("activity_type");

-- CreateIndex
CREATE INDEX "user_activity_logs_timestamp_idx" ON "user_activity_logs"("timestamp");

-- CreateIndex
CREATE INDEX "user_activity_logs_session_id_idx" ON "user_activity_logs"("session_id");

-- CreateIndex
CREATE INDEX "user_activity_logs_resource_type_resource_id_idx" ON "user_activity_logs"("resource_type", "resource_id");

-- CreateIndex
CREATE INDEX "vendor_metrics_snapshots_vendor_id_idx" ON "vendor_metrics_snapshots"("vendor_id");

-- CreateIndex
CREATE INDEX "vendor_metrics_snapshots_snapshot_date_idx" ON "vendor_metrics_snapshots"("snapshot_date");

-- CreateIndex
CREATE INDEX "vendor_metrics_snapshots_snapshot_type_idx" ON "vendor_metrics_snapshots"("snapshot_type");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_metrics_snapshots_vendor_id_snapshot_date_snapshot_t_key" ON "vendor_metrics_snapshots"("vendor_id", "snapshot_date", "snapshot_type");

-- CreateIndex
CREATE INDEX "driver_metrics_snapshots_driver_id_idx" ON "driver_metrics_snapshots"("driver_id");

-- CreateIndex
CREATE INDEX "driver_metrics_snapshots_snapshot_date_idx" ON "driver_metrics_snapshots"("snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "driver_metrics_snapshots_driver_id_snapshot_date_snapshot_t_key" ON "driver_metrics_snapshots"("driver_id", "snapshot_date", "snapshot_type");

-- CreateIndex
CREATE INDEX "customer_engagement_metrics_customer_id_idx" ON "customer_engagement_metrics"("customer_id");

-- CreateIndex
CREATE INDEX "customer_engagement_metrics_snapshot_date_idx" ON "customer_engagement_metrics"("snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "customer_engagement_metrics_customer_id_snapshot_date_snaps_key" ON "customer_engagement_metrics"("customer_id", "snapshot_date", "snapshot_type");

-- CreateIndex
CREATE INDEX "subscription_event_logs_subscription_id_idx" ON "subscription_event_logs"("subscription_id");

-- CreateIndex
CREATE INDEX "subscription_event_logs_user_id_idx" ON "subscription_event_logs"("user_id");

-- CreateIndex
CREATE INDEX "subscription_event_logs_vendor_id_idx" ON "subscription_event_logs"("vendor_id");

-- CreateIndex
CREATE INDEX "subscription_event_logs_event_type_idx" ON "subscription_event_logs"("event_type");

-- CreateIndex
CREATE INDEX "subscription_event_logs_eventTimestamp_idx" ON "subscription_event_logs"("eventTimestamp");

-- CreateIndex
CREATE INDEX "payment_transaction_logs_user_id_idx" ON "payment_transaction_logs"("user_id");

-- CreateIndex
CREATE INDEX "payment_transaction_logs_reference_id_idx" ON "payment_transaction_logs"("reference_id");

-- CreateIndex
CREATE INDEX "payment_transaction_logs_status_idx" ON "payment_transaction_logs"("status");

-- CreateIndex
CREATE INDEX "payment_transaction_logs_payment_method_idx" ON "payment_transaction_logs"("payment_method");

-- CreateIndex
CREATE INDEX "payment_transaction_logs_initiated_at_idx" ON "payment_transaction_logs"("initiated_at");

-- CreateIndex
CREATE INDEX "platform_metrics_summaries_summary_date_idx" ON "platform_metrics_summaries"("summary_date");

-- CreateIndex
CREATE UNIQUE INDEX "platform_metrics_summaries_summary_date_summary_type_key" ON "platform_metrics_summaries"("summary_date", "summary_type");

-- CreateIndex
CREATE INDEX "zone_performance_metrics_zone_id_idx" ON "zone_performance_metrics"("zone_id");

-- CreateIndex
CREATE INDEX "zone_performance_metrics_snapshot_date_idx" ON "zone_performance_metrics"("snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "zone_performance_metrics_zone_id_snapshot_date_snapshot_typ_key" ON "zone_performance_metrics"("zone_id", "snapshot_date", "snapshot_type");

-- CreateIndex
CREATE INDEX "product_performance_metrics_product_id_idx" ON "product_performance_metrics"("product_id");

-- CreateIndex
CREATE INDEX "product_performance_metrics_vendor_id_idx" ON "product_performance_metrics"("vendor_id");

-- CreateIndex
CREATE INDEX "product_performance_metrics_snapshot_date_idx" ON "product_performance_metrics"("snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "product_performance_metrics_product_id_snapshot_date_snapsh_key" ON "product_performance_metrics"("product_id", "snapshot_date", "snapshot_type");

-- CreateIndex
CREATE INDEX "entity_change_logs_entity_type_entity_id_idx" ON "entity_change_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "entity_change_logs_actor_id_idx" ON "entity_change_logs"("actor_id");

-- CreateIndex
CREATE INDEX "entity_change_logs_change_type_idx" ON "entity_change_logs"("change_type");

-- CreateIndex
CREATE INDEX "entity_change_logs_timestamp_idx" ON "entity_change_logs"("timestamp");

-- CreateIndex
CREATE INDEX "order_lifecycle_events_order_id_idx" ON "order_lifecycle_events"("order_id");

-- CreateIndex
CREATE INDEX "order_lifecycle_events_event_type_idx" ON "order_lifecycle_events"("event_type");

-- CreateIndex
CREATE INDEX "order_lifecycle_events_event_timestamp_idx" ON "order_lifecycle_events"("event_timestamp");

-- CreateIndex
CREATE INDEX "delivery_events_order_id_idx" ON "delivery_events"("order_id");

-- CreateIndex
CREATE INDEX "delivery_events_driver_id_idx" ON "delivery_events"("driver_id");

-- CreateIndex
CREATE INDEX "delivery_events_vendor_id_idx" ON "delivery_events"("vendor_id");

-- CreateIndex
CREATE INDEX "delivery_events_event_timestamp_idx" ON "delivery_events"("event_timestamp");

-- AddForeignKey
ALTER TABLE "platform_transactions" ADD CONSTRAINT "platform_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "admin_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_held_balance_id_fkey" FOREIGN KEY ("held_balance_id") REFERENCES "held_balances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "held_balances" ADD CONSTRAINT "held_balances_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "held_balances" ADD CONSTRAINT "held_balances_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_audit_logs" ADD CONSTRAINT "dispute_audit_logs_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_commission_snapshots" ADD CONSTRAINT "order_commission_snapshots_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_metrics_snapshots" ADD CONSTRAINT "vendor_metrics_snapshots_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_metrics_snapshots" ADD CONSTRAINT "driver_metrics_snapshots_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_engagement_metrics" ADD CONSTRAINT "customer_engagement_metrics_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_event_logs" ADD CONSTRAINT "subscription_event_logs_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_event_logs" ADD CONSTRAINT "subscription_event_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zone_performance_metrics" ADD CONSTRAINT "zone_performance_metrics_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_lifecycle_events" ADD CONSTRAINT "order_lifecycle_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_events" ADD CONSTRAINT "delivery_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_events" ADD CONSTRAINT "delivery_events_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_events" ADD CONSTRAINT "delivery_events_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
