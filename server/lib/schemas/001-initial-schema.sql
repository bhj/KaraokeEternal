-- Up
CREATE TABLE IF NOT EXISTS "artists" (
  "artistId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" text NOT NULL COLLATE NOCASE,
  "nameNorm" text NOT NULL COLLATE NOCASE
);

CREATE UNIQUE INDEX IF NOT EXISTS idxNameNorm ON "artists" ("nameNorm" ASC);

CREATE TABLE IF NOT EXISTS "media" (
  mediaId integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  songId integer NOT NULL,
  pathId integer NOT NULL,
  relPath text NOT NULL,
  duration integer NOT NULL,
  isPreferred integer(1) NOT NULL DEFAULT(0),
  dateAdded integer NOT NULL DEFAULT(0),
  dateUpdated integer NOT NULL DEFAULT(0)
);

CREATE INDEX IF NOT EXISTS idxSong ON "media" ("songId" ASC);

CREATE TABLE IF NOT EXISTS "paths" (
  "pathId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "path" text NOT NULL,
  "priority" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "prefs" (
  "key" text PRIMARY KEY NOT NULL,
  "data" text NOT NULL
);

INSERT INTO prefs (key,data) VALUES ('isFirstRun','true');

CREATE TABLE IF NOT EXISTS "queue" (
  "queueId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "roomId" integer NOT NULL,
  "songId" integer NOT NULL,
  "userId" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS idxRoom ON "queue" ("roomId" ASC);

CREATE TABLE IF NOT EXISTS "rooms" (
  "roomId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" text NOT NULL,
  "status" text NOT NULL,
  "password" text,
  "dateCreated" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "songs" (
  "songId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "artistId" integer NOT NULL,
  "title" text NOT NULL COLLATE NOCASE,
  "titleNorm" text NOT NULL COLLATE NOCASE
);

CREATE INDEX IF NOT EXISTS idxTitleNorm ON "songs" ("titleNorm" ASC);

CREATE TABLE IF NOT EXISTS "artistStars" (
  "userId" integer NOT NULL,
  "artistId" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idxUserArtist ON "artistStars" ("userId" ASC, "artistId" ASC);

CREATE TABLE IF NOT EXISTS "songStars" (
  "userId" integer NOT NULL,
  "songId" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idxUserSong ON "songStars" ("userId" ASC, "songId" ASC);

CREATE TABLE IF NOT EXISTS "users" (
  "userId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "name" text NOT NULL,
  "isAdmin" integer(1) NOT NULL,
  "image" blob,
  "dateCreated" integer NOT NULL DEFAULT(0),
  "dateUpdated" integer NOT NULL DEFAULT(0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idxUsername ON "users" ("username" ASC);

-- Down
DROP TABLE artists;
DROP TABLE media;
DROP TABLE prefs;
DROP TABLE queue;
DROP TABLE rooms;
DROP TABLE songs;
DROP TABLE artistStars;
DROP TABLE songStars;
DROP TABLE users;
