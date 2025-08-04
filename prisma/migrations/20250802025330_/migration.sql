-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deleted_by_id" TEXT,
ADD COLUMN     "deleted_for_id" TEXT;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_deleted_for_id_fkey" FOREIGN KEY ("deleted_for_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
