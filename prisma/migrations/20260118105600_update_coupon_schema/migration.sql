/*
  Warnings:

  - You are about to drop the column `description` on the `coupons` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `coupons` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `coupons` table without a default value. This is not possible if the table is not empty.
  - Made the column `maxDiscount` on table `coupons` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "coupons" DROP COLUMN "description",
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "discount" SET DEFAULT '0',
ALTER COLUMN "maxDiscount" SET NOT NULL,
ALTER COLUMN "maxDiscount" SET DEFAULT 0,
ALTER COLUMN "expiresAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "coupons_name_key" ON "coupons"("name");
