/*
  Warnings:

  - Added the required column `username_change_date` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "username_change_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "username_change_date" TIMESTAMPTZ NOT NULL;
