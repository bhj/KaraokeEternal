-- Up
-- Add ownerId column for ephemeral rooms (null = admin-created persistent room)
ALTER TABLE rooms ADD COLUMN ownerId INTEGER REFERENCES users(userId);

-- Add lastActivity column for idle room cleanup
ALTER TABLE rooms ADD COLUMN lastActivity INTEGER NOT NULL DEFAULT(0);

-- Index for fast owner lookup
CREATE INDEX IF NOT EXISTS idxRoomOwner ON rooms (ownerId);

-- Down
-- SQLite doesn't support DROP COLUMN, so we'd need to recreate the table
-- For simplicity, leaving this empty as we don't expect to roll back
