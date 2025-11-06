-- Add startId and endId to curricula table
ALTER TABLE "curricula" ADD COLUMN "startId" TEXT;
ALTER TABLE "curricula" ADD COLUMN "endId" TEXT;

-- Create new unique constraint
DROP INDEX IF EXISTS "curricula_year_version_departmentId_key";
CREATE UNIQUE INDEX "curricula_year_startId_endId_key" ON "curricula"("year", "startId", "endId");
