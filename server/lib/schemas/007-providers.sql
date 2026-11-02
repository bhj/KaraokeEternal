-- Up
CREATE TABLE IF NOT EXISTS "providers" (
  "providerId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" text NOT NULL,
  "url" text NOT NULL,
  "priority" integer NOT NULL DEFAULT 0,
  "data" text NOT NULL DEFAULT('{}')
);

-- Down
DROP TABLE IF EXISTS "providers";
