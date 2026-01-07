/*
  Warnings:

  - Added the required column `image` to the `languages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "languages" ADD COLUMN     "image" TEXT NOT NULL,
ADD COLUMN     "is_rtl" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "code" SET DEFAULT 'ar';
