/*
  Warnings:

  - You are about to drop the column `deleted_for_id` on the `messages` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_deleted_for_id_fkey";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "deleted_for_id",
ADD COLUMN     "deleted_for" TEXT DEFAULT 'self';
