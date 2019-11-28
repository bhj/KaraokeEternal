const db = require('sqlite')
const log = require('../lib/logger')('Media')
const sql = require('sqlate')

class Media {
  /**
   * Get media matching all search criteria
   *
   * @param  {object}  filter Search criteria
   * @return {Promise}        Object with media results
   */
  static async search (filter) {
    const media = {
      result: [],
      entities: {}
    }

    const whereClause = typeof filter !== 'object' ? sql`true`
      : sql`${sql.tuple(Object.keys(filter).map(sql.column))} = ${sql.tuple(Object.values(filter))}`

    const query = sql`
      SELECT media.*, songs.*, artists.artistId, artists.name AS artist, artists.nameNorm AS artistNorm
      FROM media
        INNER JOIN songs USING (songId)
        INNER JOIN artists USING (artistId)
      WHERE ${whereClause}
    `
    const rows = await db.all(String(query), query.parameters)

    for (const row of rows) {
      media.result.push(row.mediaId)
      media.entities[row.mediaId] = row
    }

    return media
  }

  /**
   * Add media file to the library
   *
   * @param  {object}  media Media object
   * @return {number}        New media's mediaId
   */
  static async add (media) {
    if (!Number.isInteger(media.songId) ||
        !Number.isInteger(media.duration) ||
        !Number.isInteger(media.pathId) ||
        !media.relPath
    ) throw new Error('invalid media data: ' + JSON.stringify(media))

    // currently uses an Object instead of Map
    const query = sql`
      INSERT INTO media ${sql.tuple(Object.keys(media).map(sql.column))}
      VALUES ${sql.tuple(Object.values(media))}
    `
    const res = await db.run(String(query), query.parameters)

    if (!Number.isInteger(res.stmt.lastID)) {
      throw new Error('invalid lastID from media insert')
    }

    return res.stmt.lastID
  }

  /**
   * Update media item
   *
   * @param  {object}  media Media object
   * @return {Promise}
   */
  static async update (media) {
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
    await db.run(String(query), query.parameters)
  }

  /**
   * Removes media from the db in sqlite-friendly batches
   *
   * @param  {array}  mediaIds
   * @return {Promise}
   */
  static async remove (mediaIds) {
    const batchSize = 999

    while (mediaIds.length) {
      const query = sql`
        DELETE FROM media
        WHERE mediaId IN ${sql.in(mediaIds.splice(0, batchSize))}
      `
      const res = await db.run(String(query), query.parameters)

      log.info(`removed ${res.stmt.changes} media`)
    }
  }

  /**
   * Remove unlinked items and VACUUM
   *
   * @return {Promise}
   */
  static async cleanup () {
    let res

    // remove media in nonexistent paths
    res = await db.run(`
      DELETE FROM media WHERE mediaId IN (
        SELECT media.mediaId FROM media LEFT JOIN paths USING(pathId) WHERE paths.pathId IS NULL
      )
    `)
    log.info(`cleanup: ${res.stmt.changes} media in nonexistent paths`)

    // remove stars for nonexistent songs
    res = await db.run(`
      DELETE FROM songStars WHERE songId IN (
        SELECT songStars.songId FROM songStars LEFT JOIN songs USING(songId) WHERE songs.songId IS NULL
      )
    `)
    log.info(`cleanup: ${res.stmt.changes} stars for nonexistent songs`)

    log.info('cleanup: vacuuming database')
    await db.run('VACUUM')
  }

  /**
   * Set isPreferred flag for a given media item
   *
   * @param  {number}  songId
   * @return {Promise}
   */
  static async setPreferred (mediaId, isPreferred) {
    if (!Number.isInteger(mediaId) || typeof isPreferred !== 'boolean') {
      throw new Error('invalid mediaId or value')
    }

    // get songId
    const res = await Media.search({ mediaId })

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
    await db.run(String(query), query.parameters)

    if (isPreferred) {
      await Media.update({ mediaId, isPreferred: 1 })
    }
  }
}

Media.mimeTypes = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  cdg: 'application/octet-stream',
}

module.exports = Media
