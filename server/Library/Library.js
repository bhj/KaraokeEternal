const db = require('../lib/Database').db
const sql = require('sqlate')
const log = require('../lib/Log').getLogger('Library')
const { performance } = require('perf_hooks')
const Media = require('../Media')

class Library {
  static cache = { version: null }
  static starCountsCache = { version: null }

  /**
  * Get artists and songs in a format suitable for sending to clients.
  * Should not include songs or artists for which there are no media.
  *
  * @return {Promise} Object with artists and songs normalized
  */
  static async get () {
    // already cached?
    if (this.cache.version) return this.cache

    const startTime = performance.now()

    const SongIdsByArtist = {}
    const artists = {
      result: [],
      entities: {}
    }
    const songs = {
      result: [],
      entities: {}
    }

    // query #1: songs
    {
      const query = sql`
        SELECT duration, songs.artistId AS artistId, songs.songId AS songId, songs.title AS title,
          MAX(isPreferred) AS isPreferred, COUNT(DISTINCT media.mediaId) AS numMedia
        FROM media
          INNER JOIN songs USING (songId)
          INNER JOIN paths USING (pathId)
        GROUP BY songId
        ORDER BY songs.titleNorm, paths.priority ASC
      `
      const rows = await db.all(String(query), query.parameters)

      for (const row of rows) {
        delete row.isPreferred
        songs.entities[row.songId] = row
        songs.result.push(row.songId)

        // add to artist's songIds
        if (typeof SongIdsByArtist[row.artistId] === 'undefined') {
          SongIdsByArtist[row.artistId] = []
        }

        SongIdsByArtist[row.artistId].push(row.songId)
      }
    }

    // query #2: artists
    {
      const query = sql`
        SELECT artistId, name
        FROM artists
        ORDER BY nameNorm ASC
      `
      const rows = await db.all(String(query), query.parameters)

      for (const row of rows) {
        if (SongIdsByArtist[row.artistId]) {
          artists.result.push(row.artistId)
          artists.entities[row.artistId] = row
          artists.entities[row.artistId].songIds = SongIdsByArtist[row.artistId]
        }
      }
    }

    log.info('built library cache in %sms', (performance.now() - startTime).toFixed(3))

    // cache result
    this.cache = {
      artists,
      songs,
      version: Date.now(),
    }

    return this.cache
  }

  /**
  * Get single song in format similar to get()
  *
  * @param  {number}  songId
  * @return {Promise} normalized media entries
  */
  static async getSong (songId) {
    const { result, entities } = await Media.search({ songId })
    if (!result.length) return {}

    // should be in order of path priority...
    let media = entities[result[0]]

    // ...but are any preferred?
    for (const mediaId of result) {
      if (entities[mediaId].isPreferred) media = entities[mediaId]
    }

    return {
      [songId]: {
        artistId: media.artistId,
        duration: media.duration,
        songId: media.songId,
        title: media.title,
        numMedia: result.length,
      }
    }
  }

  /**
  * Matches or creates artist and song
  *
  * @param  {object}  parsed  The object returned from MetaParser
  * @return {object}          { artistId, songId }
  */
  static async matchSong (parsed) {
    const match = {}

    // match artist
    {
      const query = sql`
        SELECT *
        FROM artists
        WHERE nameNorm = ${parsed.artistNorm}
      `
      const row = await db.get(String(query), query.parameters)

      if (row) {
        log.debug('matched artist: %s', row.name)
        match.artistId = row.artistId
        match.artist = row.name
        match.artistNorm = row.nameNorm
      } else {
        log.debug('new artist: %s', parsed.artist)

        const fields = new Map()
        fields.set('name', parsed.artist)
        fields.set('nameNorm', parsed.artistNorm)

        const query = sql`
          INSERT INTO artists ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
          VALUES ${sql.tuple(Array.from(fields.values()))}
        `
        const res = await db.run(String(query), query.parameters)

        if (!Number.isInteger(res.lastID)) {
          throw new Error('invalid artistId after insert')
        }

        match.artistId = res.lastID
        match.artist = parsed.artist
        match.artistNorm = parsed.artistNorm
      }
    }

    // match song title
    {
      const query = sql`
        SELECT *
        FROM songs
        WHERE artistId = ${match.artistId} AND titleNorm = ${parsed.titleNorm}
      `
      const row = await db.get(String(query), query.parameters)

      if (row) {
        log.debug('matched song: %s', row.title)
        match.songId = row.songId
        match.title = row.title
        match.titleNorm = row.titleNorm
      } else {
        log.debug('new song: %s', parsed.title)

        const fields = new Map()
        fields.set('artistId', match.artistId)
        fields.set('title', parsed.title)
        fields.set('titleNorm', parsed.titleNorm)

        const query = sql`
          INSERT INTO songs ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
          VALUES ${sql.tuple(Array.from(fields.values()))}
        `
        const res = await db.run(String(query), query.parameters)

        if (!Number.isInteger(res.lastID)) {
          throw new Error('invalid songId after insert')
        }

        match.songId = res.lastID
        match.title = parsed.title
        match.titleNorm = parsed.titleNorm
      }
    }

    return match
  }

  /**
  * Gets a user's starred artists and songs
  *
  * @param  {Number}  userId
  * @return {Object}
  */
  static async getUserStars (userId) {
    let starredArtists, starredSongs

    // get starred artists
    {
      const query = sql`
        SELECT artistId
        FROM artistStars
        WHERE userId = ${userId}
      `
      const rows = await db.all(String(query), query.parameters)

      starredArtists = rows.map(row => row.artistId)
    }

    // get starred songs
    {
      const query = sql`
        SELECT songId
        FROM songStars
        WHERE userId = ${userId}
      `
      const rows = await db.all(String(query), query.parameters)

      starredSongs = rows.map(row => row.songId)
    }

    return { starredArtists, starredSongs }
  }

  /**
  * Add a user's star to a song
  *
  * @param  {Number}  songId
  * @param  {Number}  userId
  * @return {Promise} Number of rows affected
  */
  static async starSong (songId, userId) {
    const fields = new Map()
    fields.set('songId', songId)
    fields.set('userId', userId)

    const query = sql`
      INSERT OR IGNORE INTO songStars ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
      VALUES ${sql.tuple(Array.from(fields.values()))}
    `
    const res = await db.run(String(query), query.parameters)

    if (res.changes) {
      // invalidate cache
      this.starCountsCache.version = null
    }

    return res.changes
  }

  /**
  * Remove a user's star from a song
  *
  * @param  {Number}  songId
  * @param  {Number}  userId
  * @return {Promise} Number of rows affected
  */
  static async unstarSong (songId, userId) {
    const query = sql`
      DELETE FROM songStars
      WHERE userId = ${userId} AND songId = ${songId}
    `
    const res = await db.run(String(query), query.parameters)

    if (res.changes) {
      // invalidate cache
      this.starCountsCache.version = null
    }

    return res.changes
  }

  /**
  * Gets artist and song star counts
  *
  * @return {Object}
  */
  static async getStarCounts () {
    // already cached?
    if (this.starCountsCache.version) return this.starCountsCache

    const startTime = performance.now()

    const artists = {}
    const songs = {}

    // get artist star counts
    {
      const query = sql`
        SELECT artistId, COUNT(userId) AS count
        FROM artistStars
        GROUP BY artistId
      `
      const rows = await db.all(String(query), query.parameters)

      rows.forEach(row => { artists[row.artistId] = row.count })
    }

    // get song star counts
    {
      const query = sql`
        SELECT songId, COUNT(userId) AS count
        FROM songStars
        GROUP BY songId
      `
      const rows = await db.all(String(query), query.parameters)

      rows.forEach(row => { songs[row.songId] = row.count })
    }

    log.info('built star count cache in %sms', (performance.now() - startTime).toFixed(3))

    this.starCountsCache = {
      artists,
      songs,
      version: Date.now(),
    }

    return this.starCountsCache
  }
}

module.exports = Library
