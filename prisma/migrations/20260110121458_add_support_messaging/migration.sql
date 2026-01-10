/*
  Warnings:

  - You are about to drop the column `hide_photos` on the `vendors` table. All the data in the column will be lost.
  - You are about to drop the column `isSelfDelivery` on the `vendors` table. All the data in the column will be lost.
  - Made the column `vendorTypeId` on table `vendors` required. This step will fail if there are existing NULL values in that column.
  - Made the column `zoneId` on table `vendors` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SupportMessageType" AS ENUM ('text', 'image', 'video');

-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_vendorTypeId_fkey";

-- DropForeignKey
ALTER TABLE "vendors" DROP CONSTRAINT "vendors_zoneId_fkey";

-- AlterTable
ALTER TABLE "subscription_plans" ADD COLUMN     "total_orders" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "vendors" DROP COLUMN "hide_photos",
DROP COLUMN "isSelfDelivery",
ALTER COLUMN "vendorTypeId" SET NOT NULL,
ALTER COLUMN "zoneId" SET NOT NULL;

-- CreateTable
CREATE TABLE "support_inboxes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "user_profile_image" TEXT,
    "admin_id" TEXT,
    "admin_name" TEXT,
    "last_message" TEXT,
    "last_message_type" "SupportMessageType" NOT NULL DEFAULT 'text',
    "last_sender_id" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_inboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "inbox_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "sender_role" TEXT NOT NULL,
    "type" "SupportMessageType" NOT NULL DEFAULT 'text',
    "message" TEXT,
    "file_path" TEXT,
    "video_thumbnail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_messages_inbox_id_idx" ON "support_messages"("inbox_id");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_vendorTypeId_fkey" FOREIGN KEY ("vendorTypeId") REFERENCES "vendor_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_inbox_id_fkey" FOREIGN KEY ("inbox_id") REFERENCES "support_inboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
