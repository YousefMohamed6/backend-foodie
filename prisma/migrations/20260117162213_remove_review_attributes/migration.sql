/*
  Warnings:

  - You are about to drop the column `attributeId` on the `review_ratings` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `review_ratings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `review_ratings` table. All the data in the column will be lost.
  - You are about to drop the `_CategoryToReviewAttribute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `review_attributes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CategoryToReviewAttribute" DROP CONSTRAINT "_CategoryToReviewAttribute_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToReviewAttribute" DROP CONSTRAINT "_CategoryToReviewAttribute_B_fkey";

-- DropForeignKey
ALTER TABLE "review_ratings" DROP CONSTRAINT "review_ratings_attributeId_fkey";

-- AlterTable
ALTER TABLE "review_ratings" DROP COLUMN "attributeId",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "_CategoryToReviewAttribute";

-- DropTable
DROP TABLE "review_attributes";
