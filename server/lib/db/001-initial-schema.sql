-- Up
CREATE TABLE IF NOT EXISTS "artists" (
  "artistId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "media" (
  "mediaId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "artistId" integer NOT NULL,
  "title" text NOT NULL,
  "duration" integer NOT NULL,
  "provider" text NOT NULL,
  "providerData" text NOT NULL,
  "isPreferred" integer(1) NOT NULL DEFAULT(0),
  "lastTimestamp" integer NOT NULL DEFAULT(0)
);

CREATE TABLE IF NOT EXISTS "prefs" (
  "key" text NOT NULL,
  "data" text NOT NULL
);

INSERT INTO prefs (key,data) VALUES ('isFirstRun','true');

CREATE TABLE IF NOT EXISTS "providers" (
  "name" text PRIMARY KEY NOT NULL,
  "isEnabled" integer NOT NULL,
  "priority" integer NOT NULL,
  "prefs" text NOT NULL
);

CREATE INDEX IF NOT EXISTS providerName ON "providers" ("name" ASC);

CREATE TABLE IF NOT EXISTS "queue" (
  "queueId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "roomId" integer NOT NULL,
  "mediaId" integer NOT NULL,
  "userId" integer NOT NULL
);

CREATE TABLE IF NOT EXISTS "rooms" (
  "roomId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" text NOT NULL,
  "status" text NOT NULL,
  "dateCreated" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "stars" (
  "mediaId" integer NOT NULL,
  "userId" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS mediaId ON "stars" ("mediaId" ASC);

CREATE TABLE IF NOT EXISTS "users" (
  "userId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "email" text NOT NULL,
  "password" text NOT NULL,
  "name" text NOT NULL,
  "isAdmin" integer(1) NOT NULL
);

-- Down
DROP TABLE artists;
DROP TABLE media;
DROP TABLE prefs;
DROP TABLE providers;
DROP TABLE queue;
DROP TABLE rooms;
DROP TABLE stars;
DROP TABLE users;
