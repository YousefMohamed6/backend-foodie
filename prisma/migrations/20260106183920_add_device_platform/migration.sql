/*
  Warnings:

  - You are about to drop the `order_addresses` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DevicePlatform" AS ENUM ('android', 'ios', 'web');

-- DropForeignKey
ALTER TABLE "order_addresses" DROP CONSTRAINT "order_addresses_orderId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "device_platform" "DevicePlatform";

-- DropTable
DROP TABLE "order_addresses";
