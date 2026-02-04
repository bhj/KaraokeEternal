-- Up
-- Add position column for fractional indexing (nullable first for migration)
ALTER TABLE "queue" ADD COLUMN "position" TEXT;

-- Assign positions based on existing order (using queueId as fallback)
-- Items with prevQueueId=NULL get position 'a00000001', others get sequential positions
UPDATE queue SET position = 'a' || printf('%08d', queueId);

-- Create index for position sorting
CREATE INDEX IF NOT EXISTS idxPosition ON "queue" ("roomId" ASC, "position" ASC);

-- Down
DROP INDEX IF EXISTS idxPosition;
ALTER TABLE "queue" DROP COLUMN "position";
