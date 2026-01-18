/*
  Warnings:

  - You are about to drop the column `public` on the `special_discounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "special_discounts" DROP COLUMN "public",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_publish" BOOLEAN NOT NULL DEFAULT false;
