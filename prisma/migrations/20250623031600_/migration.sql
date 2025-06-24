-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "blocked_by_creator" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "blocked_by_participant" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deleted_by_creator" TIMESTAMP(3),
ADD COLUMN     "deleted_by_participant" TIMESTAMP(3);
