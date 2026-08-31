-- Up
ALTER TABLE "media" ADD COLUMN "pitch" integer;

CREATE TABLE IF NOT EXISTS "userPitches" (
  "userId" integer NOT NULL REFERENCES users(userId) DEFERRABLE INITIALLY DEFERRED,
  "mediaId" integer NOT NULL,
  "pitch" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idxUserMedia ON "userPitches" ("userId" ASC, "mediaId" ASC);

-- Down
DROP TABLE userPitches;

ALTER TABLE "media" DROP COLUMN "pitch";
