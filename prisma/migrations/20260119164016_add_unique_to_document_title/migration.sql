/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `documents` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "documents_title_key" ON "documents"("title");
