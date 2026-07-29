-- Up
ALTER TABLE "media" ADD COLUMN "pitch" integer;

-- Down
ALTER TABLE "media" DROP COLUMN "pitch";
