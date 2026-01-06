-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'paid');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'Driver Accepted';
ALTER TYPE "OrderStatus" ADD VALUE 'Order Shipped';
ALTER TYPE "OrderStatus" ADD VALUE 'In Transit';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'manager';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "address_id" TEXT,
ADD COLUMN     "cash_reported_at" TIMESTAMP(3),
ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "payment_status" "PaymentStatus" NOT NULL DEFAULT 'unpaid';

-- CreateTable
CREATE TABLE "manager_audit_logs" (
    "id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "driver_id" TEXT,
    "action" TEXT NOT NULL DEFAULT 'dispatch',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_cash_confirmations" (
    "id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_cash_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manager_payout_confirmations" (
    "id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payout_date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_payout_confirmations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_audit_logs" ADD CONSTRAINT "manager_audit_logs_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_audit_logs" ADD CONSTRAINT "manager_audit_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_audit_logs" ADD CONSTRAINT "manager_audit_logs_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_cash_confirmations" ADD CONSTRAINT "manager_cash_confirmations_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_cash_confirmations" ADD CONSTRAINT "manager_cash_confirmations_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_cash_confirmations" ADD CONSTRAINT "manager_cash_confirmations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_payout_confirmations" ADD CONSTRAINT "manager_payout_confirmations_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manager_payout_confirmations" ADD CONSTRAINT "manager_payout_confirmations_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
