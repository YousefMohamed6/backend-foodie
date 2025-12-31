/*
  Warnings:

  - You are about to drop the column `userId` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `is_publish` on the `advertisements` table. All the data in the column will be lost.
  - You are about to drop the column `set_id` on the `advertisements` table. All the data in the column will be lost.
  - You are about to drop the column `is_publish` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `set_id` on the `banners` table. All the data in the column will be lost.
  - You are about to drop the column `cashbackType` on the `cashbacks` table. All the data in the column will be lost.
  - You are about to drop the column `cashbackValue` on the `cashbacks` table. All the data in the column will be lost.
  - You are about to drop the column `isEnable` on the `cashbacks` table. All the data in the column will be lost.
  - You are about to drop the column `publish` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `review_attributes` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `show_in_homepage` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `vendorID` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessage` on the `chat_channels` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `chat_channels` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `chat_messages` table. All the data in the column will be lost.
  - You are about to drop the column `isEnabled` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `resturant_id` on the `coupons` table. All the data in the column will be lost.
  - You are about to drop the column `isEnabled` on the `currencies` table. All the data in the column will be lost.
  - You are about to drop the column `authorID` on the `dine_in_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `vendorID` on the `dine_in_bookings` table. All the data in the column will be lost.
  - You are about to drop the column `backImage` on the `driver_documents` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `driver_documents` table. All the data in the column will be lost.
  - You are about to drop the column `driverId` on the `driver_documents` table. All the data in the column will be lost.
  - You are about to drop the column `frontImage` on the `driver_documents` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `driver_documents` table. All the data in the column will be lost.
  - You are about to drop the column `isEnable` on the `gift_card_templates` table. All the data in the column will be lost.
  - You are about to drop the column `isEnable` on the `languages` table. All the data in the column will be lost.
  - You are about to drop the column `extras` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `authorID` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `driverID` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `vendorID` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `addOnsPrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `addOnsTitle` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `categoryID` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `disPrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `extras` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `photos` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `publish` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `specification` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `veg` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `vendorID` on the `products` table. All the data in the column will be lost.
  - The primary key for the `reviews` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `CustomerId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `Id` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `VendorId` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `orderid` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `photos` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `reviewAttributes` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `vendorID` on the `stories` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `stories` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDay` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `isEnable` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `active` on the `taxes` table. All the data in the column will be lost.
  - You are about to drop the column `carName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `carNumber` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `carPictureURL` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `inProgressOrderID` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `orderRequestData` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `rotation` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `userBankDetails` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `vendorID` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `wallet_amount` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `DeliveryCharge` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `adminCommission` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `closeDineTime` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `dine_in_active` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `enabledDiveInFuture` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `filters` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `hidephotos` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `openDineTime` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `phonenumber` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `photos` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantMenuPhotos` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `reststatus` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `specialDiscount` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `specialDiscountEnable` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `workingHours` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `isTopUp` on the `wallet_transactions` table. All the data in the column will be lost.
  - You are about to drop the column `publish` on the `zones` table. All the data in the column will be lost.
  - You are about to drop the `drivers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `customerId` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cashback_value` to the `cashbacks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `author_id` to the `dine_in_bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendor_id` to the `dine_in_bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `document_type` to the `driver_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driver_id` to the `driver_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `front_image` to the `driver_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `author_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendor_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `payment_method` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `vendor_id` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customer_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `reviews` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `vendor_id` to the `reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendor_id` to the `stories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `video_url` to the `stories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration_days` to the `subscription_plans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('wallet', 'card', 'cash', 'online');

-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_userId_fkey";

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_vendorID_fkey";

-- DropForeignKey
ALTER TABLE "coupons" DROP CONSTRAINT "coupons_resturant_id_fkey";

-- DropForeignKey
ALTER TABLE "dine_in_bookings" DROP CONSTRAINT "dine_in_bookings_authorID_fkey";

-- DropForeignKey
ALTER TABLE "dine_in_bookings" DROP CONSTRAINT "dine_in_bookings_vendorID_fkey";

-- DropForeignKey
ALTER TABLE "driver_documents" DROP CONSTRAINT "driver_documents_driverId_fkey";

-- DropForeignKey
ALTER TABLE "drivers" DROP CONSTRAINT "drivers_userId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_authorID_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_driverID_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_vendorID_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_categoryID_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_vendorID_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_CustomerId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_VendorId_fkey";

-- DropForeignKey
ALTER TABLE "stories" DROP CONSTRAINT "stories_vendorID_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_vendorID_fkey";

-- AlterTable
ALTER TABLE "addresses" DROP COLUMN "userId",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "advertisements" DROP COLUMN "is_publish",
DROP COLUMN "set_id",
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "redirect_id" TEXT;

-- AlterTable
ALTER TABLE "banners" DROP COLUMN "is_publish",
DROP COLUMN "set_id",
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "redirect_id" TEXT;

-- AlterTable
ALTER TABLE "cashbacks" DROP COLUMN "cashbackType",
DROP COLUMN "cashbackValue",
DROP COLUMN "isEnable",
ADD COLUMN     "cashback_type" TEXT NOT NULL DEFAULT 'fixed',
ADD COLUMN     "cashback_value" TEXT NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "publish",
DROP COLUMN "review_attributes",
DROP COLUMN "show_in_homepage",
DROP COLUMN "vendorID",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_on_homepage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vendor_id" TEXT;

-- AlterTable
ALTER TABLE "chat_channels" DROP COLUMN "lastMessage",
DROP COLUMN "orderId",
ADD COLUMN     "last_message" TEXT,
ADD COLUMN     "order_id" TEXT;

-- AlterTable
ALTER TABLE "chat_messages" DROP COLUMN "url";

-- AlterTable
ALTER TABLE "coupons" DROP COLUMN "isEnabled",
DROP COLUMN "resturant_id",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "vendor_id" TEXT;

-- AlterTable
ALTER TABLE "currencies" DROP COLUMN "isEnabled",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "dine_in_bookings" DROP COLUMN "authorID",
DROP COLUMN "vendorID",
ADD COLUMN     "author_id" TEXT NOT NULL,
ADD COLUMN     "vendor_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "driver_documents" DROP COLUMN "backImage",
DROP COLUMN "documentId",
DROP COLUMN "driverId",
DROP COLUMN "frontImage",
DROP COLUMN "type",
ADD COLUMN     "back_image" TEXT,
ADD COLUMN     "document_number" TEXT,
ADD COLUMN     "document_type" TEXT NOT NULL,
ADD COLUMN     "driver_id" TEXT NOT NULL,
ADD COLUMN     "front_image" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "gift_card_templates" DROP COLUMN "isEnable",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "languages" DROP COLUMN "isEnable",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "extras";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "address",
DROP COLUMN "authorID",
DROP COLUMN "driverID",
DROP COLUMN "vendorID",
ADD COLUMN     "author_id" TEXT NOT NULL,
ADD COLUMN     "driver_id" TEXT,
ADD COLUMN     "vendor_id" TEXT NOT NULL,
DROP COLUMN "payment_method",
ADD COLUMN     "payment_method" "PaymentMethod" NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "addOnsPrice",
DROP COLUMN "addOnsTitle",
DROP COLUMN "categoryID",
DROP COLUMN "disPrice",
DROP COLUMN "extras",
DROP COLUMN "photos",
DROP COLUMN "publish",
DROP COLUMN "specification",
DROP COLUMN "veg",
DROP COLUMN "vendorID",
ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "dis_price" DECIMAL(10,2),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_veg" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vendor_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_pkey",
DROP COLUMN "CustomerId",
DROP COLUMN "Id",
DROP COLUMN "VendorId",
DROP COLUMN "orderid",
DROP COLUMN "photos",
DROP COLUMN "reviewAttributes",
ADD COLUMN     "customer_id" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "order_id" TEXT,
ADD COLUMN     "vendor_id" TEXT NOT NULL,
ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "stories" DROP COLUMN "vendorID",
DROP COLUMN "videoUrl",
ADD COLUMN     "vendor_id" TEXT NOT NULL,
ADD COLUMN     "video_url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "expiryDay",
DROP COLUMN "isEnable",
ADD COLUMN     "duration_days" INTEGER NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "taxes" DROP COLUMN "active",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "carName",
DROP COLUMN "carNumber",
DROP COLUMN "carPictureURL",
DROP COLUMN "inProgressOrderID",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
DROP COLUMN "orderRequestData",
DROP COLUMN "rotation",
DROP COLUMN "userBankDetails",
DROP COLUMN "vendorID",
DROP COLUMN "wallet_amount",
ADD COLUMN     "vendor_id" TEXT;

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "DeliveryCharge",
DROP COLUMN "adminCommission",
DROP COLUMN "closeDineTime",
DROP COLUMN "dine_in_active",
DROP COLUMN "enabledDiveInFuture",
DROP COLUMN "filters",
DROP COLUMN "hidephotos",
DROP COLUMN "openDineTime",
DROP COLUMN "phonenumber",
DROP COLUMN "photos",
DROP COLUMN "restaurantMenuPhotos",
DROP COLUMN "reststatus",
DROP COLUMN "specialDiscount",
DROP COLUMN "specialDiscountEnable",
DROP COLUMN "workingHours",
ADD COLUMN     "hide_photos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_dine_in_active" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phone_number" TEXT;

-- AlterTable
ALTER TABLE "wallet_transactions" DROP COLUMN "isTopUp",
ADD COLUMN     "is_top_up" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "zones" DROP COLUMN "publish",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "drivers";

-- CreateTable
CREATE TABLE "customer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wallet_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "status" "DriverStatus" NOT NULL DEFAULT 'Offline',
    "vehicleType" TEXT,
    "licensePlate" TEXT,
    "currentLat" DECIMAL(10,8),
    "currentLng" DECIMAL(11,8),
    "rotation" DECIMAL(5,2),
    "carName" TEXT,
    "carNumber" TEXT,
    "carPictureURL" TEXT,
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_schedules" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "open_time" TEXT NOT NULL,
    "close_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "vendor_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_commissions" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'percentage',

    CONSTRAINT "vendor_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_photos" (
    "id" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "vendor_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_menu_photos" (
    "id" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "vendor_menu_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_extras" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "product_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_addresses" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "building" TEXT NOT NULL,
    "floor" TEXT,
    "apartment" TEXT,
    "landmark" TEXT,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_extras" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "orderItemId" TEXT NOT NULL,

    CONSTRAINT "order_item_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "id" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_ratings" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "reviewId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,

    CONSTRAINT "review_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToReviewAttribute" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_profiles_userId_key" ON "customer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_userId_key" ON "driver_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_commissions_vendorId_key" ON "vendor_commissions"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "order_addresses_orderId_key" ON "order_addresses"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToReviewAttribute_AB_unique" ON "_CategoryToReviewAttribute"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToReviewAttribute_B_index" ON "_CategoryToReviewAttribute"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_profiles" ADD CONSTRAINT "driver_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_schedules" ADD CONSTRAINT "vendor_schedules_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_commissions" ADD CONSTRAINT "vendor_commissions_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_photos" ADD CONSTRAINT "vendor_photos_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_menu_photos" ADD CONSTRAINT "vendor_menu_photos_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_extras" ADD CONSTRAINT "product_extras_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_addresses" ADD CONSTRAINT "order_addresses_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_extras" ADD CONSTRAINT "order_item_extras_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_documents" ADD CONSTRAINT "driver_documents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "driver_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_channels" ADD CONSTRAINT "chat_channels_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dine_in_bookings" ADD CONSTRAINT "dine_in_bookings_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dine_in_bookings" ADD CONSTRAINT "dine_in_bookings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_ratings" ADD CONSTRAINT "review_ratings_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_ratings" ADD CONSTRAINT "review_ratings_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "review_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToReviewAttribute" ADD CONSTRAINT "_CategoryToReviewAttribute_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToReviewAttribute" ADD CONSTRAINT "_CategoryToReviewAttribute_B_fkey" FOREIGN KEY ("B") REFERENCES "review_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
