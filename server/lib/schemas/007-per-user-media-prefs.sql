-- Up

-- Room-level version defaults set by room managers.
-- One row per (room, song) pair; overrides the global isPreferred flag for
-- users in that room who have not set a personal preference.
CREATE TABLE IF NOT EXISTS "roomMediaPrefs" (
  "roomId"  integer NOT NULL REFERENCES rooms(roomId)  ON DELETE CASCADE,
  "songId"  integer NOT NULL,
  "mediaId" integer NOT NULL REFERENCES media(mediaId) ON DELETE CASCADE,
  PRIMARY KEY ("roomId", "songId")
);

CREATE INDEX IF NOT EXISTS idxRoomMediaPrefsSong ON "roomMediaPrefs" ("songId" ASC);

-- Per-user version preferences set by any user (including guests).
-- Highest priority in the resolution chain; cleared automatically when the
-- user row is deleted (ON DELETE CASCADE).
CREATE TABLE IF NOT EXISTS "userMediaPrefs" (
  "userId"  integer NOT NULL REFERENCES users(userId)  ON DELETE CASCADE,
  "songId"  integer NOT NULL,
  "mediaId" integer NOT NULL REFERENCES media(mediaId) ON DELETE CASCADE,
  PRIMARY KEY ("userId", "songId")
);

CREATE INDEX IF NOT EXISTS idxUserMediaPrefsSong ON "userMediaPrefs" ("songId" ASC);

-- Store the resolved mediaId on each queue row so that version resolution
-- happens once at add-time (and on explicit preference changes) rather than
-- being re-derived on every Queue.get() call.
ALTER TABLE queue ADD COLUMN "mediaId" integer REFERENCES media(mediaId);

-- Backfill existing queue rows: prefer the isPreferred media, fall back to
-- the lowest-priority path's first media file.
UPDATE queue SET mediaId = (
  SELECT m.mediaId FROM media m
  INNER JOIN paths p ON m.pathId = p.pathId
  WHERE m.songId = queue.songId
  ORDER BY m.isPreferred DESC, p.priority ASC
  LIMIT 1
);

-- Down
DROP INDEX IF EXISTS idxRoomMediaPrefsSong;
DROP TABLE IF EXISTS "roomMediaPrefs";
DROP INDEX IF EXISTS idxUserMediaPrefsSong;
DROP TABLE IF EXISTS "userMediaPrefs";
-- Note: SQLite does not support DROP COLUMN before 3.35.0.
-- The mediaId column is left in place on rollback; it is nullable and
-- harmless if the application code that reads it is also rolled back.
