/*
  Warnings:

  - You are about to drop the `_CityToListing` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CityToListing" DROP CONSTRAINT "_CityToListing_A_fkey";

-- DropForeignKey
ALTER TABLE "_CityToListing" DROP CONSTRAINT "_CityToListing_B_fkey";

-- DropTable
DROP TABLE "_CityToListing";

-- CreateTable
CREATE TABLE "_ListingCities" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ListingCities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ListingCities_B_index" ON "_ListingCities"("B");

-- AddForeignKey
ALTER TABLE "_ListingCities" ADD CONSTRAINT "_ListingCities_A_fkey" FOREIGN KEY ("A") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ListingCities" ADD CONSTRAINT "_ListingCities_B_fkey" FOREIGN KEY ("B") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
