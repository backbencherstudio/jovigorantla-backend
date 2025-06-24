/*
  Warnings:

  - You are about to drop the column `city` on the `listings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "listings" DROP COLUMN "city",
ADD COLUMN     "address" TEXT;
