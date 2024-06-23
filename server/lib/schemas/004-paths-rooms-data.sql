-- Up
ALTER TABLE "paths" ADD COLUMN "data" text NOT NULL DEFAULT('{}');
ALTER TABLE "rooms" ADD COLUMN "data" text NOT NULL DEFAULT('{}');

-- Down
ALTER TABLE "paths" DROP COLUMN "data";
ALTER TABLE "rooms" DROP COLUMN "data";
