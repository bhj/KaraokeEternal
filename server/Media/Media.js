const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:media')

class Media {
/**
 * Get artists and "songs" in a format suitable for sending to clients
 * as quickly as possible. Only lists one media item per song (the
 * preferred item, if one is set) and does not include providerData
 *
 * @return {Promise} Object with artist and media results
 */
  static async getLibrary () {
    const artists = {
      result: [],
      entities: {}
    }
    const songs = {
      result: [],
      entities: {}
    }

    // query #1: artists
    try {
      const q = squel.select()
        .from('artists')
        .order('name')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      for (const row of rows) {
        artists.result.push(row.artistId)
        artists.entities[row.artistId] = {
          ...row,
          songIds: [],
        }
      }
    } catch (err) {
      return Promise.reject(err)
    }

    // query #2: songs
    try {
      const q = squel.select()
        .field('media.mediaId, media.duration')
        .field('songs.artistId, songs.songId, songs.title')
        .field('MAX(media.isPreferred) AS isPreferred')
        .field('COUNT(DISTINCT media.mediaId) AS numMedia')
        .field('COUNT(DISTINCT stars.userId) AS numStars')
        .from('media')
        .join(squel.select()
          .from('providers')
          .where('providers.isEnabled = 1')
          .order('priority'),
        'providers', 'media.provider = providers.name')
        .join('songs USING (songId)')
        .left_join('stars USING(songId)')
        .group('songs.songId')
        .order('songs.title')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      for (const row of rows) {
        // no need to send over the wire but we needed it
        // in the query to show the correct mediaId
        delete row.isPreferred

        // ensure artist exists
        if (typeof artists.entities[row.artistId] === 'undefined') {
          log(`Warning: artist does not exist for song: ${JSON.stringify(row)}`)
          continue
        }

        // add songId to artist's data
        artists.entities[row.artistId].songIds.push(row.songId)

        songs.result.push(row.songId)
        songs.entities[row.songId] = row
      }
    } catch (err) {
      return Promise.reject(err)
    }

    return { artists, songs }
  }

  /**
   * Get media items matching all search criteria
   *
   * @param  {object}  fields Search criteria
   * @return {Promise}        Object with media results
   */
  static async searchMedia (fields) {
    const media = {
      result: [],
      entities: {}
    }

    const q = squel.select()
      .field('media.*')
      .from('media')
      .join(squel.select()
        .from('providers')
        .where('providers.isEnabled = 1')
        .order('priority'),
      'providers', 'media.provider = providers.name')

    // filters
    Object.keys(fields).map(key => {
      if (key === 'providerData') {
        Object.keys(fields.providerData).map(pKey => {
          const val = fields.providerData[pKey]

          // handle arrays (do nothing if val is an empty array)
          if (Array.isArray(val) && val.length) {
            q.where(`json_extract(providerData, '$.${pKey}') IN ?`, val)
          } else if (!Array.isArray(val)) {
            q.where(`json_extract(providerData, '$.${pKey}') = ?`, val)
          }
        })
      } else {
        q.where(`${key} = ?`, fields[key])
      }
    })

    try {
      const { text, values } = q.toParam()
      const res = await db.all(text, values)

      for (const row of res) {
        media.result.push(row.mediaId)
        row.providerData = JSON.parse(row.providerData)
        media.entities[row.mediaId] = row
      }
    } catch (err) {
      return Promise.reject(err)
    }

    return media
  }

  /**
   * Add media item to the library, matching or adding artist
   *
   * @param  {object}  media Media item
   * @return {Promise}       Newly added item's mediaId (number)
   */
  static async add (meta) {
    let artistId, songId

    if (!meta.artist || !meta.title || !meta.duration || !meta.provider) {
      return Promise.reject(new Error('invalid metadata: ' + JSON.stringify(meta)))
    }

    // match/create artist
    try {
      const q = squel.select()
        .from('artists')
        .where('name = ?', meta.artist)

      const { text, values } = q.toParam()
      const row = await db.get(text, values)

      if (row) {
        log('matched artist: %s', row.name)
        artistId = row.artistId
      }
    } catch (err) {
      return Promise.reject(err)
    }

    // new artist?
    if (typeof artistId === 'undefined') {
      log('new artist: %s', meta.artist)

      try {
        const q = squel.insert()
          .into('artists')
          .set('name', meta.artist)

        const { text, values } = q.toParam()
        const res = await db.run(text, values)

        if (!Number.isInteger(res.stmt.lastID)) {
          throw new Error('invalid lastID from artist insert')
        }

        artistId = res.stmt.lastID
      } catch (err) {
        return Promise.reject(err)
      }
    }

    // match/create song
    try {
      const q = squel.select()
        .from('songs')
        .where('artistId = ?', artistId)
        .where('title = ?', meta.title)

      const { text, values } = q.toParam()
      const row = await db.get(text, values)

      if (row) {
        log('matched song: %s', row.title)
        songId = row.songId
      }
    } catch (err) {
      return Promise.reject(err)
    }

    // new song?
    if (typeof songId === 'undefined') {
      log('new song: %s', meta.title)

      try {
        const q = squel.insert()
          .into('songs')
          .set('artistId', artistId)
          .set('title', meta.title)

        const { text, values } = q.toParam()
        const res = await db.run(text, values)

        if (!Number.isInteger(res.stmt.lastID)) {
          throw new Error('invalid lastID from song insert')
        }

        // we have our new songId
        songId = res.stmt.lastID
      } catch (err) {
        return Promise.reject(err)
      }
    }

    // create media entry
    try {
      const q = squel.insert()
        .into('media')
        .set('songId', songId)
        .set('duration', Math.round(meta.duration))
        .set('provider', meta.provider)
        .set('providerData', JSON.stringify(meta.providerData || {}))
        // @todo
        // .set('lastTimestamp', meta.timestamp)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (!Number.isInteger(res.stmt.lastID)) {
        throw new Error('invalid lastID from media insert')
      }

      // return mediaId
      return Promise.resolve(res.stmt.lastID)
    } catch (err) {
      log(err)
      return Promise.reject(err)
    }
  }

  /**
   * Removes mediaIds in sqlite-friendly batches
   *
   * @param  {array}  mediaIds
   * @return {Promise}
   */
  static async remove (mediaIds) {
    const batchSize = 999

    while (mediaIds.length) {
      const q = squel.delete()
        .from('media')
        .where('mediaId IN ?', mediaIds.splice(0, batchSize))

      try {
        const { text, values } = q.toParam()
        await db.run(text, values)
      } catch (err) {
        return Promise.reject(err)
      }
    }

    // @todo: remove songs without associated media
  }
}

module.exports = Media
