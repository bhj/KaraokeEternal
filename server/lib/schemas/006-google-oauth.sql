-- Up
ALTER TABLE users ADD COLUMN "googleId" text;

CREATE UNIQUE INDEX IF NOT EXISTS idxGoogleId ON "users" ("googleId" ASC);

-- Down
DROP INDEX IF EXISTS idxGoogleId;

ALTER TABLE users DROP COLUMN googleId;
