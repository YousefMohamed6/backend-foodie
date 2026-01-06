/*
  Warnings:

  - You are about to drop the column `admin_commission_amount` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `admin_commission_percentage` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_price_per_km` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `distance_in_km` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_subtotal` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `order_total` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `vendor_earnings` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "orders" DROP COLUMN "admin_commission_amount",
DROP COLUMN "admin_commission_percentage",
DROP COLUMN "delivery_price_per_km",
DROP COLUMN "distance_in_km",
DROP COLUMN "order_subtotal",
DROP COLUMN "order_total",
DROP COLUMN "vendor_earnings",
ADD COLUMN     "adminCommissionAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "adminCommissionPercentage" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryPricePerKm" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "distanceInKm" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "orderSubtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "orderTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vendorEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "subscriptionId" TEXT;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
