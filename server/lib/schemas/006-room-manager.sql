-- Up
INSERT INTO roles (name) VALUES ('room_manager');

CREATE TABLE IF NOT EXISTS "roomManagers" (
  "roomId" integer NOT NULL REFERENCES rooms(roomId) ON DELETE CASCADE,
  "userId" integer NOT NULL REFERENCES users(userId) ON DELETE CASCADE,
  PRIMARY KEY ("roomId", "userId")
);

CREATE INDEX IF NOT EXISTS idxRoomManagersUser ON "roomManagers" ("userId" ASC);

-- Down
DROP INDEX IF EXISTS idxRoomManagersUser;
DROP TABLE IF EXISTS "roomManagers";
DELETE FROM roles WHERE name = 'room_manager';
