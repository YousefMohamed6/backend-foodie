-- DropForeignKey
ALTER TABLE "referrals" DROP CONSTRAINT "referrals_referredId_fkey";

-- DropForeignKey
ALTER TABLE "referrals" DROP CONSTRAINT "referrals_referrerId_fkey";

-- AlterTable
ALTER TABLE "currencies" ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "languages" ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
