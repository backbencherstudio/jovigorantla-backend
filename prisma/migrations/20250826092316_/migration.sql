/*
  Warnings:

  - The `deleted_by_creator` column on the `conversations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `deleted_by_participant` column on the `conversations` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "deleted_by_creator_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_participant_at" TIMESTAMP(3),
DROP COLUMN "deleted_by_creator",
ADD COLUMN     "deleted_by_creator" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "deleted_by_participant",
ADD COLUMN     "deleted_by_participant" BOOLEAN NOT NULL DEFAULT false;
