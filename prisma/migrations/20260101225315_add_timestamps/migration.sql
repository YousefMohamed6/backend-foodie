/*
  Warnings:

  - You are about to drop the column `is_published` on the `advertisements` table. All the data in the column will be lost.
  - You are about to drop the column `is_published` on the `banners` table. All the data in the column will be lost.
  - The `cashback_value` column on the `cashbacks` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `totalGuest` column on the `dine_in_bookings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `discount` column on the `dine_in_bookings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `expiryDay` column on the `gift_card_templates` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `itemAttributes` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `profile` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `uname` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `stories` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `users` table. All the data in the column will be lost.
  - The `subscriptionTotalOrders` column on the `vendors` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `flutterwave` on the `withdraw_methods` table. All the data in the column will be lost.
  - You are about to drop the column `paypal` on the `withdraw_methods` table. All the data in the column will be lost.
  - You are about to drop the column `razorpay` on the `withdraw_methods` table. All the data in the column will be lost.
  - You are about to drop the column `stripe` on the `withdraw_methods` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `cashback_redeems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `customer_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `favorite_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `favorite_vendors` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `order_item_extras` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `product_extras` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `review_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `review_ratings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `vendor_commissions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `vendor_menu_photos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `vendor_photos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `vendor_schedules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `wallet_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "advertisements" DROP COLUMN "is_published",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "banners" DROP COLUMN "is_published",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "cashback_redeems" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "cashbacks" DROP COLUMN "cashback_value",
ADD COLUMN     "cashback_value" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "customer_profiles" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "dine_in_bookings" DROP COLUMN "totalGuest",
ADD COLUMN     "totalGuest" INTEGER NOT NULL DEFAULT 1,
DROP COLUMN "discount",
ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "favorite_products" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "favorite_vendors" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "gift_card_templates" DROP COLUMN "expiryDay",
ADD COLUMN     "expiryDay" INTEGER DEFAULT 30;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "order_item_extras" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "product_extras" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "itemAttributes";

-- AlterTable
ALTER TABLE "review_images" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "review_ratings" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "profile",
DROP COLUMN "uname",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "stories" DROP COLUMN "active",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "active",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "vendor_commissions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "vendor_menu_photos" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "vendor_photos" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "vendor_schedules" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "subscriptionTotalOrders",
ADD COLUMN     "subscriptionTotalOrders" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "withdraw_methods" DROP COLUMN "flutterwave",
DROP COLUMN "paypal",
DROP COLUMN "razorpay",
DROP COLUMN "stripe",
ADD COLUMN     "config" JSONB,
ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'stripe';

-- CreateTable
CREATE TABLE "product_attributes" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_attributes_productId_idx" ON "product_attributes"("productId");

-- AddForeignKey
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
