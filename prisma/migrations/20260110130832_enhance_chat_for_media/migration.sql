/*
  Warnings:

  - You are about to drop the column `chatType` on the `chat_channels` table. All the data in the column will be lost.
  - You are about to drop the column `customerId` on the `chat_channels` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `chat_channels` table. All the data in the column will be lost.
  - You are about to drop the column `customerProfileImage` on the `chat_channels` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `chat_channels` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantName` on the `chat_channels` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantProfileImage` on the `chat_channels` table. All the data in the column will be lost.
  - You are about to drop the column `messageType` on the `chat_messages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "chat_channels" DROP COLUMN "chatType",
DROP COLUMN "customerId",
DROP COLUMN "customerName",
DROP COLUMN "customerProfileImage",
DROP COLUMN "restaurantId",
DROP COLUMN "restaurantName",
DROP COLUMN "restaurantProfileImage",
ADD COLUMN     "chat_type" TEXT,
ADD COLUMN     "customer_id" TEXT,
ADD COLUMN     "customer_name" TEXT,
ADD COLUMN     "customer_profile_image" TEXT,
ADD COLUMN     "driver_id" TEXT,
ADD COLUMN     "driver_name" TEXT,
ADD COLUMN     "driver_profile_image" TEXT,
ADD COLUMN     "last_message_type" TEXT DEFAULT 'TEXT',
ADD COLUMN     "restaurant_id" TEXT,
ADD COLUMN     "restaurant_name" TEXT,
ADD COLUMN     "restaurant_profile_image" TEXT;

-- AlterTable
ALTER TABLE "chat_messages" DROP COLUMN "messageType",
ADD COLUMN     "file_path" TEXT,
ADD COLUMN     "message_type" TEXT NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "video_thumbnail" TEXT,
ALTER COLUMN "message" DROP NOT NULL;
