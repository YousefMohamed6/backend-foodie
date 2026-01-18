-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "special_discount" JSONB,
ADD COLUMN     "special_discount_enable" BOOLEAN NOT NULL DEFAULT false;
