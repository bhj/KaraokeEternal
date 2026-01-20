-- Up
-- Track authentication provider for each user (local vs SSO)
-- SSO users should not be able to change their credentials in the app
ALTER TABLE users ADD COLUMN "authProvider" text NOT NULL DEFAULT 'local';

-- Down
-- SQLite doesn't support DROP COLUMN in all versions
-- For simplicity, leaving this empty as we don't expect to roll back
