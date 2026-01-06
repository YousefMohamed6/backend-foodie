-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "admin_commission_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "admin_commission_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "delivery_price_per_km" DECIMAL(10,2),
ADD COLUMN     "distance_in_km" DECIMAL(10,2),
ADD COLUMN     "order_subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "order_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "vendor_earnings" DECIMAL(10,2) NOT NULL DEFAULT 0;
