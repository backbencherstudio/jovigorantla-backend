/*
  Warnings:

  - You are about to drop the column `username_change_count` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `username_change_date` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "username_change_count",
DROP COLUMN "username_change_date",
ADD COLUMN     "name_change_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "name_change_date" TIMESTAMPTZ;
