/*
  Warnings:

  - You are about to drop the column `document_number` on the `driver_documents` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[driver_id,document_id]` on the table `driver_documents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `document_id` to the `driver_documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "driver_documents" DROP COLUMN "document_number",
ADD COLUMN     "document_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "driver_documents_driver_id_document_id_key" ON "driver_documents"("driver_id", "document_id");
