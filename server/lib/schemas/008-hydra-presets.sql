-- Up
CREATE TABLE IF NOT EXISTS "hydraFolders" (
  "folderId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" text NOT NULL,
  "authorUserId" integer NOT NULL REFERENCES users(userId),
  "authorName" text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT(0),
  "dateCreated" integer NOT NULL DEFAULT(0)
);

CREATE TABLE IF NOT EXISTS "hydraPresets" (
  "presetId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "folderId" integer NOT NULL REFERENCES hydraFolders(folderId) ON DELETE CASCADE,
  "name" text NOT NULL,
  "code" text NOT NULL,
  "authorUserId" integer NOT NULL REFERENCES users(userId),
  "authorName" text NOT NULL,
  "sortOrder" integer NOT NULL DEFAULT(0),
  "dateCreated" integer NOT NULL DEFAULT(0),
  "dateUpdated" integer NOT NULL DEFAULT(0)
);

CREATE INDEX IF NOT EXISTS idxHydraPresetFolder ON "hydraPresets" ("folderId" ASC);
CREATE INDEX IF NOT EXISTS idxHydraPresetAuthor ON "hydraPresets" ("authorUserId" ASC);

-- Down
DROP TABLE IF EXISTS "hydraPresets";
DROP TABLE IF EXISTS "hydraFolders";
