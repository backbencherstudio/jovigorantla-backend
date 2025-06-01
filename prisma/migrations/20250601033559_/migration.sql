/*
  Warnings:

  - You are about to drop the column `active` on the `cities` table. All the data in the column will be lost.
  - You are about to drop the column `boundary` on the `cities` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `cities` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `cities` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `cities` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `cities` table. All the data in the column will be lost.
  - You are about to drop the column `flagged_listing_status` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `listings` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `listings` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('NORMAL', 'POST_TO_USA');

-- DropIndex
DROP INDEX "cities_slug_key";

-- DropIndex
DROP INDEX "listings_flagged_listing_status_idx";

-- AlterTable
ALTER TABLE "cities" DROP COLUMN "active",
DROP COLUMN "boundary",
DROP COLUMN "country",
DROP COLUMN "name",
DROP COLUMN "slug",
DROP COLUMN "state",
ADD COLUMN     "address" TEXT;

-- AlterTable
ALTER TABLE "listings" DROP COLUMN "flagged_listing_status",
DROP COLUMN "latitude",
DROP COLUMN "location",
DROP COLUMN "longitude",
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'APPROVED',
ALTER COLUMN "usa_listing_status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "report_type" "ReportType" NOT NULL DEFAULT 'NORMAL';

-- CreateTable
CREATE TABLE "_CityToListing" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CityToListing_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CityToListing_B_index" ON "_CityToListing"("B");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- AddForeignKey
ALTER TABLE "_CityToListing" ADD CONSTRAINT "_CityToListing_A_fkey" FOREIGN KEY ("A") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CityToListing" ADD CONSTRAINT "_CityToListing_B_fkey" FOREIGN KEY ("B") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
