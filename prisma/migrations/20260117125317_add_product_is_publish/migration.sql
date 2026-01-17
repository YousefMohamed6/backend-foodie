/*
  Warnings:

  - You are about to drop the column `calories` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `fats` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `gram` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `is_veg` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `proteins` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "calories",
DROP COLUMN "fats",
DROP COLUMN "gram",
DROP COLUMN "is_veg",
DROP COLUMN "proteins",
ADD COLUMN     "is_publish" BOOLEAN NOT NULL DEFAULT true;
