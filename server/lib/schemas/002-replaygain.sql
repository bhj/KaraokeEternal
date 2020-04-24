-- Up
ALTER TABLE "media" ADD COLUMN "rgTrackGain" REAL;
ALTER TABLE "media" ADD COLUMN "rgTrackPeak" REAL;

INSERT INTO prefs (key,data) VALUES ('isReplayGainEnabled','false');

-- Down
