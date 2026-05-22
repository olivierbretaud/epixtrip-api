-- AlterTable
ALTER TABLE "travels" ADD COLUMN "coverId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "travels_coverId_key" ON "travels"("coverId");

-- AddForeignKey
ALTER TABLE "travels" ADD CONSTRAINT "travels_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "medias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
