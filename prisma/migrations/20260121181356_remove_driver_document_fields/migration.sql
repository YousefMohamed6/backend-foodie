/*
  Warnings:

  - You are about to drop the column `document_number` on the `driver_documents` table. All the data in the column will be lost.
  - You are about to drop the column `expire_at` on the `driver_documents` table. All the data in the column will be lost.
  - The `status` column on the `driver_documents` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "driver_documents" DROP COLUMN "document_number",
DROP COLUMN "expire_at",
DROP COLUMN "status",
ADD COLUMN     "status" "DocumentStatus" NOT NULL DEFAULT 'pending';
