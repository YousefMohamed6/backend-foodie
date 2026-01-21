-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "special_discount_id" TEXT;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_special_discount_id_fkey" FOREIGN KEY ("special_discount_id") REFERENCES "special_discounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
