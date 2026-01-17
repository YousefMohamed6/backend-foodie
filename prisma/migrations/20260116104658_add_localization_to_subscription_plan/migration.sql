/*
  Warnings:

  - You are about to drop the column `features` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `subscription_plans` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `subscription_plans` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[fcmToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `arabic_name` to the `subscription_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `english_name` to the `subscription_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `subscription_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `place` to the `subscription_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `products_limit` to the `subscription_plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `subscription_plans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WithdrawStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WithdrawalMethod" AS ENUM ('MANUAL', 'BANK', 'INSTAPAY', 'VODAFONE_CASH');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'fixed');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "arabic_name" TEXT,
ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "english_name" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivery_otp" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewsSum" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "subscription_plans" DROP COLUMN "features",
DROP COLUMN "name",
ADD COLUMN     "arabic_name" TEXT NOT NULL,
ADD COLUMN     "english_name" TEXT NOT NULL,
ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "place" TEXT NOT NULL,
ADD COLUMN     "plan_points" TEXT[],
ADD COLUMN     "products_limit" INTEGER NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "subscription_products_limit" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE "subscription_features" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL DEFAULT true,
    "plan_id" TEXT NOT NULL,

    CONSTRAINT "subscription_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdraw_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "WithdrawStatus" NOT NULL DEFAULT 'PENDING',
    "method" "WithdrawalMethod" NOT NULL,
    "accountDetails" JSONB,
    "referenceId" TEXT,
    "adminNotes" TEXT,
    "snapshotBalance" DECIMAL(10,2),
    "payoutAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),

    CONSTRAINT "withdraw_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "method" "WithdrawalMethod" NOT NULL,
    "details" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_documents" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "front_image" TEXT,
    "back_image" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "special_discounts" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL,
    "coupon_code" TEXT NOT NULL,
    "photo" TEXT NOT NULL,
    "discount_type" "DiscountType" NOT NULL DEFAULT 'percentage',
    "enable" BOOLEAN NOT NULL DEFAULT false,
    "public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "special_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_documents_vendor_id_document_id_key" ON "vendor_documents"("vendor_id", "document_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_fcmToken_key" ON "users"("fcmToken");

-- AddForeignKey
ALTER TABLE "subscription_features" ADD CONSTRAINT "subscription_features_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdraw_requests" ADD CONSTRAINT "withdraw_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdraw_requests" ADD CONSTRAINT "withdraw_requests_payoutAccountId_fkey" FOREIGN KEY ("payoutAccountId") REFERENCES "payout_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_accounts" ADD CONSTRAINT "payout_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_documents" ADD CONSTRAINT "vendor_documents_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "special_discounts" ADD CONSTRAINT "special_discounts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
