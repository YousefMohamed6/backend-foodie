/*
  Warnings:

  - You are about to drop the column `createdAt` on the `advertisements` table. All the data in the column will be lost.
  - You are about to drop the column `redirectUrl` on the `advertisements` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `advertisements` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `advertisements` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `advertisements` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "advertisements" DROP CONSTRAINT "advertisements_vendorId_fkey";

-- AlterTable
ALTER TABLE "advertisements" DROP COLUMN "createdAt",
DROP COLUMN "redirectUrl",
DROP COLUMN "updatedAt",
DROP COLUMN "vendorId",
ADD COLUMN     "canceled_note" TEXT,
ADD COLUMN     "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "cover_image" TEXT,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "is_paused" BOOLEAN,
ADD COLUMN     "pause_note" TEXT,
ADD COLUMN     "payment_status" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" TEXT DEFAULT 'N/A',
ADD COLUMN     "profile_image" TEXT,
ADD COLUMN     "redirect_url" TEXT,
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "type" TEXT DEFAULT 'vendor_promotion',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vendor_id" TEXT,
ADD COLUMN     "video" TEXT,
ALTER COLUMN "photo" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
