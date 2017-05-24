-- Up
CREATE TABLE IF NOT EXISTS "artists" (
  "artistId" integer PRIMARY KEY AUTOINCREMENT,
  "name" text
);

CREATE TABLE IF NOT EXISTS "prefs" (
  "domain" text,
  "data" text
);

INSERT INTO prefs (domain,data) VALUES ('app','{"firstRun":true}');
INSERT INTO prefs (domain,data) VALUES ('provider.cdg','{"enabled":true,"paths":[]}');
INSERT INTO prefs (domain,data) VALUES ('provider.youtube','{"enabled":true,"channels":[],"apiKey":""}');

CREATE TABLE IF NOT EXISTS "queue" (
  "queueId" integer PRIMARY KEY AUTOINCREMENT,
  "roomId" integer,
  "songId" integer,
  "userId" integer
);

CREATE TABLE IF NOT EXISTS "rooms" (
  "roomId" integer PRIMARY KEY AUTOINCREMENT,
  "status" text,
  "name" text
);

CREATE TABLE IF NOT EXISTS "songs" (
  "songId" integer PRIMARY KEY AUTOINCREMENT,
  "artistId" integer,
  "title" text,
  "duration" integer,
  "provider" text,
  "providerData" text
);

CREATE TABLE IF NOT EXISTS "stars" (
  "songId" integer NOT NULL,
  "userId" integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS preventDupes ON "stars" ("songId", "userId");

CREATE TABLE IF NOT EXISTS "users" (
  "userId" integer PRIMARY KEY AUTOINCREMENT,
  "email" text,
  "password" text,
  "name" text,
  "isAdmin" integer
);

-- Down
DROP TABLE artists;
DROP TABLE prefs;
DROP TABLE queue;
DROP TABLE rooms;
DROP TABLE songs;
DROP TABLE stars;
DROP TABLE users;
