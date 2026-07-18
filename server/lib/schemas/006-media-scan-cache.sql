-- Up
CREATE INDEX IF NOT EXISTS idxMediaPathRelPath ON "media" ("pathId" ASC, "relPath" ASC);
CREATE INDEX IF NOT EXISTS idxMediaPath ON "media" ("pathId" ASC);
CREATE INDEX IF NOT EXISTS idxSongArtistTitleNorm ON "songs" ("artistId" ASC, "titleNorm" ASC);

-- Down
DROP INDEX idxSongArtistTitleNorm;
DROP INDEX idxMediaPath;
DROP INDEX idxMediaPathRelPath;
