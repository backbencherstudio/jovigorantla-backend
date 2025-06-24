/*
  Warnings:

  - You are about to drop the column `attachment_id` on the `messages` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_attachment_id_fkey";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "attachment_id";
