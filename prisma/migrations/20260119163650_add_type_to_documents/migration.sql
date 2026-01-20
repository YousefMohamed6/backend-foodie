/*
  Warnings:

  - You are about to drop the column `backSide` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `expireAt` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `frontSide` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `documents` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Rename columns and add new type column
ALTER TABLE "documents" 
  RENAME COLUMN "backSide" TO "back_side";

ALTER TABLE "documents" 
  RENAME COLUMN "frontSide" TO "front_side";

ALTER TABLE "documents" 
  RENAME COLUMN "expireAt" TO "expire_at";

ALTER TABLE "documents" 
  RENAME COLUMN "createdAt" TO "created_at";

ALTER TABLE "documents" 
  RENAME COLUMN "updatedAt" TO "updated_at";

ALTER TABLE "documents" 
  ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'vendor';
