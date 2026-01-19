-- DropForeignKey
ALTER TABLE "special_discounts" DROP CONSTRAINT "special_discounts_vendor_id_fkey";

-- AddForeignKey
ALTER TABLE "special_discounts" ADD CONSTRAINT "special_discounts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
