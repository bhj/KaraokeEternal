-- Up
ALTER TABLE "rooms" ADD COLUMN "remoteControlQREnabled" INTEGER;

UPDATE rooms
SET remoteControlQREnabled = 0;

-- Down
ALTER TABLE "rooms" DROP COLUMN "remoteControlQREnabled";
