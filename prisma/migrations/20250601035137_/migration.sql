/*
  Warnings:

  - Made the column `latitude` on table `cities` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `cities` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `cities` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "cities" ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "longitude" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL;
