-- AlterTable
ALTER TABLE "driver_documents" ADD COLUMN     "expire_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vendor_documents" ADD COLUMN     "expire_at" TIMESTAMP(3);
