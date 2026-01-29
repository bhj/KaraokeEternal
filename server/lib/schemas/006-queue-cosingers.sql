-- Up
ALTER TABLE "queue" ADD COLUMN "coSingers" TEXT DEFAULT NULL;

-- Down
ALTER TABLE "queue" DROP COLUMN "coSingers";
