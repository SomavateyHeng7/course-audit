-- Make startId and endId required
ALTER TABLE "curricula" ALTER COLUMN "startId" SET NOT NULL;
ALTER TABLE "curricula" ALTER COLUMN "endId" SET NOT NULL;
