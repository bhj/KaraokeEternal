-- Up
ALTER TABLE "media" ADD COLUMN "rgTrackGain" REAL;
ALTER TABLE "media" ADD COLUMN "rgTrackPeak" REAL;

INSERT OR IGNORE INTO prefs (key,data) VALUES ('isReplayGainEnabled','false');

-- Down
ALTER TABLE "media" DROP COLUMN "rgTrackGain";
ALTER TABLE "media" DROP COLUMN "rgTrackPeak";
