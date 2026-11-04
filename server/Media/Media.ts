import sql from 'sqlate'
import { db } from '../lib/Database.js'
import getLogger from '../lib/Log.js'
import Queue from '../Queue/Queue.js'

const log = getLogger('Media')

interface MediaRow {
  mediaId: number
  songId: number
  artistId: number
  title: string
  duration: number
  pathId: number
  relPath: string
  rgTrackGain: number | null
  rgTrackPeak: number | null
  dateUpdated: number
  isPreferred?: number
  pitch?: number | null
  [key: string]: unknown
}

/** the only columns FileScanner needs to diff a file against its row */
export interface MediaIndexRow {
  mediaId: number
  songId: number
  pathId: number
  relPath: string
  duration: number
  rgTrackGain: number | null
  rgTrackPeak: number | null
  dateUpdated: number
}

class Media {
  /**
   * Index of a path's media, for the scanner: every mediaId, plus the columns
   * needed to diff a file against its row, keyed by relPath (first row wins for
   * any duplicate).
   *
   * Deliberately narrower than search(): the scanner holds this for the whole
   * scan, and search()'s joined songs/artists/paths columns would multiply that
   * for data it never reads.
   */
  static getPathIndex (pathId: number): { mediaIds: number[], byRelPath: Map<string, MediaIndexRow> } {
    const query = sql`
      SELECT mediaId, songId, pathId, relPath, duration, rgTrackGain, rgTrackPeak, dateUpdated
      FROM media
      WHERE pathId = ${pathId}
      ORDER BY mediaId
    `
    const rows = db.all<MediaIndexRow>(String(query), query.parameters)
    const byRelPath = new Map<string, MediaIndexRow>()

    for (const row of rows) {
      if (!byRelPath.has(row.relPath)) byRelPath.set(row.relPath, row)
    }

    return { mediaIds: rows.map(row => row.mediaId), byRelPath }
  }

  /**
   * Get media matching all search criteria
   */
  static search (filter: object): { result: number[], entities: Record<number, MediaRow> } {
    const media: { result: number[], entities: Record<number, MediaRow> } = {
      result: [],
      entities: {},
    }

    const whereClause = typeof filter !== 'object'
      ? sql`true`
      : sql`${sql.tuple(Object.keys(filter).map(sql.column))} = ${sql.tuple(Object.values(filter))}`

    const query = sql`
      SELECT
        media.*,
        songs.*,
        artists.artistId, artists.name AS artist, artists.nameNorm AS artistNorm,
        paths.pathId, paths.path
      FROM media
        INNER JOIN songs USING (songId)
        INNER JOIN artists USING (artistId)
        INNER JOIN paths USING (pathId)
      WHERE ${whereClause}
      ORDER BY paths.priority ASC
    `
    const rows = db.all<MediaRow>(String(query), query.parameters)

    for (const row of rows) {
      media.result.push(row.mediaId)
      media.entities[row.mediaId] = row
    }

    return media
  }

  /**
   * Add media file to the library
   */
  static add (media: Record<string, unknown>): number {
    if (!Number.isInteger(media.songId)
      || !Number.isInteger(media.duration)
      || !Number.isInteger(media.pathId)
      || !media.relPath
    ) throw new Error('invalid media data: ' + JSON.stringify(media))

    // currently uses an Object instead of Map
    const query = sql`
      INSERT INTO media ${sql.tuple(Object.keys(media).map(sql.column))}
      VALUES ${sql.tuple(Object.values(media))}
    `
    const res = db.run(String(query), query.parameters)

    if (!Number.isInteger(res.lastID)) {
      throw new Error('invalid lastID from media insert')
    }

    return res.lastID
  }

  /**
   * Update media item
   */
  static update (media: Record<string, unknown>): void {
    const { mediaId } = media

    if (!Number.isInteger(mediaId)) {
      throw new Error(`invalid mediaId: ${mediaId}`)
    }

    // currently uses an Object instead of Map
    delete media.mediaId

    const query = sql`
      UPDATE media
      SET ${sql.tuple(Object.keys(media).map(sql.column))} = ${sql.tuple(Object.values(media))}
      WHERE mediaId = ${mediaId}
    `
    db.run(String(query), query.parameters)
  }

  /**
   * Store client-calculated ReplayGain values, but only for media that doesn't
   * already have them. Compare-and-set rather than read-then-write since two
   * players in different rooms can analyze the same media concurrently.
   *
   * Returns whether the values were stored.
   */
  static setReplayGain (mediaId: number, rgTrackGain: number, rgTrackPeak: number): boolean {
    if (!Number.isInteger(mediaId)) {
      throw new Error(`invalid mediaId: ${mediaId}`)
    }

    // deliberately leaves dateUpdated alone: it mirrors the file's mtime, and
    // the file hasn't changed. Touching it here would make the scanner treat
    // the file as modified and re-parse it on the next scan.
    const query = sql`
      UPDATE media
      SET rgTrackGain = ${rgTrackGain},
        rgTrackPeak = ${rgTrackPeak}
      WHERE mediaId = ${mediaId}
        AND (rgTrackGain IS NULL OR rgTrackPeak IS NULL)
    `
    return db.run(String(query), query.parameters).changes === 1
  }

  /**
   * Store an admin-set default pitch offset (semitones) for a media file. A
   * pitch of 0 is stored as NULL: they're equivalent at playback, and NULL keeps
   * the column sparse and "has a default" meaningful.
   *
   * Returns whether the stored value actually changed.
   */
  static setPitch (mediaId: number, pitch: number): boolean {
    if (!Number.isInteger(mediaId)) {
      throw new Error(`invalid mediaId: ${mediaId}`)
    }

    const value = pitch === 0 ? null : pitch

    // deliberately leaves dateUpdated alone: it mirrors the file's mtime, and
    // the file hasn't changed. Touching it here would make the scanner treat
    // the file as modified and re-parse it on the next scan.
    //
    // IS NOT (null-safe) rather than != so that changes === 1 means the value
    // really changed, not merely that the row exists
    const query = sql`
      UPDATE media
      SET pitch = ${value}
      WHERE mediaId = ${mediaId}
        AND pitch IS NOT ${value}
    `
    return db.run(String(query), query.parameters).changes === 1
  }

  /**
   * Store a user's own pitch offset (semitones) for a media file, which takes
   * precedence over the media's default whenever that user sings it. Unlike
   * setPitch, 0 is stored as-is: it means "original pitch, whatever the default
   * says". Passing null clears the preference so the default applies again.
   *
   * Returns whether the stored value actually changed.
   */
  static setUserPitch (userId: number, mediaId: number, pitch: number | null): boolean {
    if (!Number.isInteger(userId) || !Number.isInteger(mediaId)) {
      throw new Error(`invalid userId or mediaId: ${userId}, ${mediaId}`)
    }

    if (pitch !== null && !Number.isInteger(pitch)) {
      throw new Error(`invalid pitch: ${pitch}`)
    }

    if (pitch === null) {
      const query = sql`
        DELETE FROM userPitches
        WHERE userId = ${userId} AND mediaId = ${mediaId}
      `
      return db.run(String(query), query.parameters).changes === 1
    }

    // sourcing the row from media means an unknown mediaId inserts nothing, so
    // a client can't grow this table with ids that don't exist (it also gives
    // the SELECT a WHERE, without which INSERT ... SELECT ... ON CONFLICT is
    // ambiguous to sqlite's parser). The DO UPDATE's own WHERE makes
    // changes === 1 mean the value really changed, as in setPitch.
    const query = sql`
      INSERT INTO userPitches (userId, mediaId, pitch)
      SELECT ${userId}, mediaId, ${pitch}
      FROM media
      WHERE mediaId = ${mediaId}
      ON CONFLICT (userId, mediaId) DO UPDATE
      SET pitch = excluded.pitch
      WHERE pitch IS NOT excluded.pitch
    `
    return db.run(String(query), query.parameters).changes === 1
  }

  /**
   * Removes media from the db in sqlite-friendly batches
   */
  static remove (mediaIds: number[]): void {
    const batchSize = 999

    while (mediaIds.length) {
      const query = sql`
        DELETE FROM media
        WHERE mediaId IN ${sql.in(mediaIds.splice(0, batchSize))}
      `
      const res = db.run(String(query), query.parameters)

      log.info(`removed ${res.changes} media`)
    }
  }

  /**
   * Remove unlinked items and VACUUM
   */
  static cleanup (): void {
    let res

    // remove media in nonexistent paths
    res = db.run(`
      DELETE FROM media WHERE mediaId IN (
        SELECT media.mediaId FROM media LEFT JOIN paths USING(pathId) WHERE paths.pathId IS NULL
      )
    `)
    log.info(`cleanup: ${res.changes} media in nonexistent paths`)

    // remove songs without associated media
    res = db.run(`
      DELETE FROM songs WHERE songId IN (
        SELECT songs.songId FROM songs LEFT JOIN media USING(songId) WHERE media.mediaId IS NULL
      )
    `)
    log.info(`cleanup: ${res.changes} songs with no associated media`)

    // remove artists without associated songs
    res = db.run(`
      DELETE FROM artists WHERE artistId IN (
        SELECT artists.artistId FROM artists LEFT JOIN songs USING(artistId) WHERE songs.songId IS NULL
      )
    `)
    log.info(`cleanup: ${res.changes} artists with no associated songs`)

    // remove stars for nonexistent artists
    res = db.run(`
      DELETE FROM artistStars WHERE artistId IN (
        SELECT artistStars.artistId FROM artistStars LEFT JOIN artists USING(artistId) WHERE artists.artistId IS NULL
      )
    `)
    log.info(`cleanup: ${res.changes} stars for nonexistent artists`)

    // remove stars for nonexistent songs
    res = db.run(`
      DELETE FROM songStars WHERE songId IN (
        SELECT songStars.songId FROM songStars LEFT JOIN songs USING(songId) WHERE songs.songId IS NULL
      )
    `)
    log.info(`cleanup: ${res.changes} stars for nonexistent songs`)

    // remove user pitches for nonexistent media
    res = db.run(`
      DELETE FROM userPitches WHERE mediaId IN (
        SELECT userPitches.mediaId FROM userPitches LEFT JOIN media USING(mediaId) WHERE media.mediaId IS NULL
      )
    `)
    log.info(`cleanup: ${res.changes} user pitches for nonexistent media`)

    // remove queue items for nonexistent songs
    const rows = db.all<{ queueId: number }>(`
      SELECT queue.queueId FROM queue LEFT JOIN songs USING(songId) WHERE songs.songId IS NULL
    `)

    for (const row of rows) {
      Queue.remove(row.queueId)
    }

    log.info(`cleanup: ${rows.length} queue items for nonexistent songs`)

    log.info('cleanup: vacuuming database')
    db.run('VACUUM')
  }

  /**
   * Set isPreferred flag for a given media item
   */
  static setPreferred (mediaId: number, isPreferred: boolean): number {
    if (!Number.isInteger(mediaId) || typeof isPreferred !== 'boolean') {
      throw new Error('invalid mediaId or value')
    }

    // get songId
    const res = Media.search({ mediaId })

    if (!res.result.length) {
      throw new Error(`mediaId not found: ${mediaId}`)
    }

    const songId = res.entities[mediaId].songId

    // clear any currently preferred items
    const query = sql`
      UPDATE media
      SET isPreferred = 0
      WHERE songId = ${songId}
    `
    db.run(String(query), query.parameters)

    if (isPreferred) {
      Media.update({ mediaId, isPreferred: 1 })
    }

    return songId
  }
}

export default Media
