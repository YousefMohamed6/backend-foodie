-- CreateEnum
CREATE TYPE "OnboardingType" AS ENUM ('driverApp', 'customerApp', 'vendorApp', 'mangerApp');

-- AlterTable
ALTER TABLE "onboarding" ADD COLUMN     "type" "OnboardingType" NOT NULL DEFAULT 'customerApp';
