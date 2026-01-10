/*
  Warnings:

  - You are about to drop the column `day` on the `vendor_schedules` table. All the data in the column will be lost.
  - Added the required column `day_id` to the `vendor_schedules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "vendor_schedules" DROP COLUMN "day",
ADD COLUMN     "day_id" INTEGER NOT NULL,
ALTER COLUMN "open_time" DROP NOT NULL,
ALTER COLUMN "close_time" DROP NOT NULL;

-- CreateTable
CREATE TABLE "week_days" (
    "id" INTEGER NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,

    CONSTRAINT "week_days_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vendor_schedules" ADD CONSTRAINT "vendor_schedules_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "week_days"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
