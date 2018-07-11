const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:media')

class Media {
  /**
   * Get media files matching all search criteria
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
      .from('media')

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
   * Add media file to the library, matching or adding artist
   *
   * @param  {object}  media Media item
   * @return {Promise}       Newly added item's mediaId (number)
   */
  static async add (media) {
    let artistId, songId

    if (!media.artist || !media.title || !media.duration) {
      return Promise.reject(new Error('invalid media data: ' + JSON.stringify(media)))
    }

    // match/create artist
    // -------------------
    const artists = [media.artist]

    // try with and without 'The'
    if (/^the /i.test(media.artist)) {
      artists.push(media.artist.replace(/^the /i, ''))
    } else {
      artists.push(`The ${media.artist}`)
    }

    {
      const q = squel.select()
        .from('artists')
        .where('name IN ? COLLATE NOCASE', artists)

      const { text, values } = q.toParam()
      const row = await db.get(text, values)

      if (row) {
        log('matched artist: %s', row.name)
        artistId = row.artistId
      }
    }

    // new artist?
    if (typeof artistId === 'undefined') {
      log('new artist: %s', media.artist)

      const q = squel.insert()
        .into('artists')
        .set('name', media.artist)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (!Number.isInteger(res.stmt.lastID)) {
        throw new Error('invalid lastID from artist insert')
      }

      artistId = res.stmt.lastID
    }

    // match/create song
    {
      const q = squel.select()
        .from('songs')
        .where('artistId = ?', artistId)
        .where('title = ? COLLATE NOCASE', media.title)

      const { text, values } = q.toParam()
      const row = await db.get(text, values)

      if (row) {
        log('matched song: %s', row.title)
        songId = row.songId
      }
    }

    // new song?
    if (typeof songId === 'undefined') {
      log('new song: %s', media.title)

      const q = squel.insert()
        .into('songs')
        .set('artistId', artistId)
        .set('title', media.title)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (!Number.isInteger(res.stmt.lastID)) {
        throw new Error('invalid lastID from song insert')
      }

      songId = res.stmt.lastID
    }

    // create media entry
    {
      const q = squel.insert()
        .into('media')
        .set('songId', songId)
        .set('duration', Math.round(media.duration))
        .set('pathId', media.pathId)
        .set('file', media.file)
        .set('timestamp', media.timestamp)

      if (media.audioExt) {
        q.set('audioExt', media.audioExt)
      }

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
   * Removes media from the db in sqlite-friendly batches
   *
   * @param  {array}  mediaIds
   * @return {Promise}
   */
  static async remove (mediaIds) {
    const batchSize = 999
    let res

    log(`removing ${mediaIds.length} media entries`)

    while (mediaIds.length) {
      const q = squel.delete()
        .from('media')
        .where('mediaId IN ?', mediaIds.splice(0, batchSize))

      const { text, values } = q.toParam()
      res = await db.run(text, values)
      log(`  => deleted ${res.stmt.changes} rows`)
    }

    // cleanup
    // remove songs without associated media
    res = await db.run(`
      DELETE FROM songs WHERE songId IN (
        SELECT songs.songId FROM songs LEFT JOIN media USING(songId) WHERE media.mediaId IS NULL
      )
    `)
    log(`cleanup: removed ${res.stmt.changes} songs with no associated media`)

    // remove artists without associated songs
    res = await db.run(`
      DELETE FROM artists WHERE artistId IN (
        SELECT artists.artistId FROM artists LEFT JOIN songs USING(artistId) WHERE songs.songId IS NULL
      )
    `)
    log(`cleanup: removed ${res.stmt.changes} artists with no associated songs`)

    // remove stars for nonexistent songs
    res = await db.run(`
      DELETE FROM stars WHERE songId IN (
        SELECT stars.songId FROM stars LEFT JOIN songs USING(songId) WHERE songs.songId IS NULL
      )
    `)
    log(`cleanup: removed ${res.stmt.changes} stars for nonexistent songs`)

    // remove nonexistent media from the queue
    res = await db.run(`
      DELETE FROM queue WHERE mediaId IN (
        SELECT queue.mediaId FROM queue LEFT JOIN media USING(mediaId) WHERE media.mediaId IS NULL
      )
    `)
    log(`cleanup: removed ${res.stmt.changes} queue entries for nonexistent media`)

    // VACUUM
    log(`cleanup: vacuuming database`)
    await db.run('VACUUM')
  }
}

Media.mimeTypes = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  mp4: 'video/mp4',
  cdg: 'application/octet-stream',
}

module.exports = Media
