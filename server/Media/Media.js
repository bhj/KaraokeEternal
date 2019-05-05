const db = require('sqlite')
const squel = require('squel')
const log = require('../lib/logger')('Media')

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
      .field('media.*, songs.*, artists.artistId, artists.name AS artist, artists.nameNorm AS artistNorm')
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
   * @param  {object}  media Media object
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
      const res = await db.run(text, values)

      log.info(`removed ${res.stmt.changes} media entries`)
    }
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
      DELETE FROM songStars WHERE songId IN (
        SELECT songStars.songId FROM songStars LEFT JOIN songs USING(songId) WHERE songs.songId IS NULL
      )
    `)
    log.info(`cleanup: removed ${res.stmt.changes} stars for nonexistent songs`)
    changes += res.stmt.changes

    // remove nonexistent songs from the queue
    res = await db.run(`
      DELETE FROM queue WHERE songId IN (
        SELECT queue.songId FROM queue LEFT JOIN media USING(songId) WHERE media.songId IS NULL
      )
    `)
    log.info(`cleanup: removed ${res.stmt.changes} queue entries for nonexistent songs`)
    changes += res.stmt.changes

    if (changes) {
      log.info(`cleanup: vacuuming database`)
      await db.run('VACUUM')
    }
  }

  /**
   * Set isPreferred flag for a given media item
   * @param  {number}  songId
   * @return {Promise}
   */
  static async setPreferred (mediaId, isPreferred) {
    if (!Number.isInteger(mediaId) || typeof isPreferred !== 'boolean') {
      throw new Error(`invalid mediaId or value`)
    }

    // get songId
    const res = await Media.search({ mediaId })

    if (!res.result.length) {
      throw new Error(`mediaId not found: ${mediaId}`)
    }

    const songId = res.entities[mediaId].songId

    // clear any currently preferred items
    const q = squel.update()
      .table('media')
      .where('songId = ?', songId)
      .set('isPreferred', 0)

    const { text, values } = q.toParam()
    await db.run(text, values)

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
