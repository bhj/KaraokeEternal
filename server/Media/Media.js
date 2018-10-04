const db = require('sqlite')
const squel = require('squel')
const log = require('../lib/logger')('media')

class Media {
  /**
   * Get media matching all search criteria
   *
   * @param  {object}  fields Search criteria
   * @return {Promise}        Object with media results
   */
  static async search (fields = {}) {
    const media = {
      result: [],
      entities: {}
    }

    const q = squel.select()
      .field('media.*, songs.*, artists.artistId, artists.name AS artist')
      .from('media')
      .join('songs USING (songId)')
      .join('artists USING (artistId)')

    // filters
    Object.keys(fields).map(key => {
      if (Array.isArray(fields[key])) {
        q.where(`${key} IN ?`, fields[key])
      } else {
        q.where(`${key} = ?`, fields[key])
      }
    })

    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    for (const row of rows) {
      media.result.push(row.mediaId)
      media.entities[row.mediaId] = row
    }

    return media
  }

  /**
   * Add media file to the library
   * @param  {object}  media Media object
   * @return {number}        New media's mediaId
   */
  static async add (media) {
    if (!Number.isInteger(media.songId) ||
        !Number.isInteger(media.duration) ||
        !Number.isInteger(media.pathId) ||
        !media.relPath
    ) throw new Error('invalid media data: ' + JSON.stringify(media))

    // create media entry
    {
      const q = squel.insert()
        .into('media')

      Object.keys(media).map(key => {
        q.set(key, media[key])
      })

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (!Number.isInteger(res.stmt.lastID)) {
        throw new Error('invalid lastID from media insert')
      }

      // return mediaId
      return res.stmt.lastID
    }
  }

  /**
   * Update media item
   * @param  {number}  mediaId
   * @param  {object}  fields
   * @return {Promise}
   */
  static async update (media) {
    if (!Number.isInteger(media.mediaId)) {
      throw new Error(`invalid mediaId: ${media.mediaId}`)
    }

    const q = squel.update()
      .table('media')
      .where('mediaId = ?', media.mediaId)

    delete media.mediaId

    Object.keys(media).map(key => {
      q.set(key, media[key])
    })

    const { text, values } = q.toParam()
    await db.run(text, values)
  }

  /**
   * Removes media from the db in sqlite-friendly batches
   * @param  {array}  mediaIds
   * @return {Promise}
   */
  static async remove (mediaIds) {
    const batchSize = 999

    while (mediaIds.length) {
      const q = squel.delete()
        .from('media')
        .where('mediaId IN ?', mediaIds.splice(0, batchSize))

      const { text, values } = q.toParam()
      await db.run(text, values)
    }

    await this.cleanup()
  }

  /**
   * Remove unlinked media, songs and artists
   * @return {Promise}
   */
  static async cleanup () {
    let res
    let changes = 0

    // remove songs without associated media
    res = await db.run(`
      DELETE FROM songs WHERE songId IN (
        SELECT songs.songId FROM songs LEFT JOIN media USING(songId) WHERE media.mediaId IS NULL
      )
    `)
    log.info(`cleanup: removed ${res.stmt.changes} songs with no associated media`)
    changes += res.stmt.changes

    // remove artists without associated songs
    res = await db.run(`
      DELETE FROM artists WHERE artistId IN (
        SELECT artists.artistId FROM artists LEFT JOIN songs USING(artistId) WHERE songs.songId IS NULL
      )
    `)
    log.info(`cleanup: removed ${res.stmt.changes} artists with no associated songs`)
    changes += res.stmt.changes

    // remove stars for nonexistent songs
    res = await db.run(`
      DELETE FROM starredSongs WHERE songId IN (
        SELECT starredSongs.songId FROM starredSongs LEFT JOIN songs USING(songId) WHERE songs.songId IS NULL
      )
    `)
    log.info(`cleanup: removed ${res.stmt.changes} stars for nonexistent songs`)
    changes += res.stmt.changes

    // remove nonexistent media from the queue
    res = await db.run(`
      DELETE FROM queue WHERE mediaId IN (
        SELECT queue.mediaId FROM queue LEFT JOIN media USING(mediaId) WHERE media.mediaId IS NULL
      )
    `)
    log.info(`cleanup: removed ${res.stmt.changes} queue entries for nonexistent media`)
    changes += res.stmt.changes

    if (changes) {
      log.info(`cleanup: vacuuming database`)
      await db.run('VACUUM')
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
