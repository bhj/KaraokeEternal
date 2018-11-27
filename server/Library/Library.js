const db = require('sqlite')
const squel = require('squel')
const log = require('../lib/logger')('Library')
let _libraryVersion = Date.now()
let _starCountsVersion = Date.now()

class Library {
  /**
  * Get artists and songs in a format suitable for sending to clients
  * as quickly as possible. Only lists one media item per song.
  * @return {Promise} Object with artist and media results
  */
  static async get () {
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
      const q = squel.select()
        .field('media.mediaId AS mediaId')
        .field('media.duration AS duration')
        .field('songs.artistId AS artistId')
        .field('songs.songId AS songId')
        .field('songs.title AS title')
        .field('MAX(media.isPreferred) AS isPreferred')
        .field('COUNT(DISTINCT media.mediaId) AS numMedia')
        .from('media')
        .join(squel.select()
          .from('paths')
          .field('MIN(paths.priority) AS priority')
          .field('pathId')
          .group('pathId'),
        'paths', 'media.pathId = paths.pathId')
        .join('songs USING (songId)')
        .join('artists USING (artistId)')
        .group('songs.songId')
        .order('songs.titleNorm')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      for (const row of rows) {
        // no need to send over the wire but we needed it
        // in the query to show the correct mediaId
        delete row.isPreferred

        // normalize song data
        songs.result.push(row.songId)
        songs.entities[row.songId] = row

        // add to artist's songIds
        if (typeof SongIdsByArtist[row.artistId] === 'undefined') {
          SongIdsByArtist[row.artistId] = []
        }

        SongIdsByArtist[row.artistId].push(row.songId)
      }
    }

    // query #2: artists (we do this after songs so we can ignore
    // artists having no songs, e.g. when a provider is disabled)
    // @todo see if this can be done in one query now
    {
      const q = squel.select()
        .from('artists')
        .order('nameNorm')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      for (const row of rows) {
        // don't include artists without any songs
        if (typeof SongIdsByArtist[row.artistId] === 'undefined') {
          continue
        }

        // normalize artist data
        artists.result.push(row.artistId)
        artists.entities[row.artistId] = {
          ...row,
          songIds: SongIdsByArtist[row.artistId],
        }
      }
    }

    return {
      artists,
      songs,
      version: Library.getLibraryVersion(),
    }
  }

  /**
  * Returns a single song (with the preferred mediaId)
  *
  * @param  {Number}  songId
  * @return {Promise}        Song entity (same format as with get())
  */
  static async getSong (songId) {
    const q = squel.select()
      .field('media.mediaId AS mediaId')
      .field('media.duration AS duration')
      .field('songs.artistId AS artistId')
      .field('songs.songId AS songId')
      .field('songs.title AS title')
      .field('MAX(media.isPreferred) AS isPreferred')
      .field('COUNT(DISTINCT media.mediaId) AS numMedia')
      .field('COUNT(DISTINCT songStars.userId) AS numStars')
      .from('media')
      .join(squel.select()
        .from('paths')
        .field('MIN(paths.priority) AS priority')
        .field('pathId')
        .group('pathId'),
      'paths', 'media.pathId = paths.pathId')
      .join('songs USING (songId)')
      .join('artists USING (artistId)')
      .left_join('songStars USING(songId)')
      .group('songs.songId')
      .where('songs.songId = ?', songId)

    const { text, values } = q.toParam()
    const row = await db.get(text, values)

    if (typeof row !== 'object') {
      throw new Error(`Song not found (songId=${songId})`)
    }

    // no need to send over the wire but we needed it
    // in the query to show the correct mediaId
    delete row.isPreferred

    return {
      [songId]: row,
    }
  }

  /**
  * Matches or creates artist and song
  * @param  {object}  parsed  The object returned from MetaParser
  * @return {object}          { artistId, songId }
  */
  static async matchSong (parsed) {
    const match = {}

    // match artist
    {
      const q = squel.select()
        .from('artists')
        .where('nameNorm = ?', parsed.artistNorm)

      const { text, values } = q.toParam()
      const row = await db.get(text, values)

      if (row) {
        // log.info('matched artist: %s', row.name)
        match.artistId = row.artistId
        match.artist = row.name
        match.artistNorm = row.nameNorm
      } else {
        log.info('new artist: %s', parsed.artist)

        const q = squel.insert()
          .into('artists')
          .set('name', parsed.artist)
          .set('nameNorm', parsed.artistNorm)

        const { text, values } = q.toParam()
        const res = await db.run(text, values)

        if (!Number.isInteger(res.stmt.lastID)) {
          throw new Error('invalid artistId after insert')
        }

        match.artistId = res.stmt.lastID
        match.artist = parsed.artist
        match.artistNorm = parsed.artistNorm
      }
    }

    // match title
    {
      const q = squel.select()
        .from('songs')
        .where('artistId = ?', match.artistId)
        .where('titleNorm = ?', parsed.titleNorm)

      const { text, values } = q.toParam()
      const row = await db.get(text, values)

      if (row) {
        // log.info('matched song: %s', row.title)
        match.songId = row.songId
        match.title = row.title
        match.titleNorm = row.titleNorm
      } else {
        log.info('new song: %s', parsed.title)

        const q = squel.insert()
          .into('songs')
          .set('artistId', match.artistId)
          .set('title', parsed.title)
          .set('titleNorm', parsed.titleNorm)

        const { text, values } = q.toParam()
        const res = await db.run(text, values)

        if (!Number.isInteger(res.stmt.lastID)) {
          throw new Error('invalid songId after insert')
        }

        match.songId = res.stmt.lastID
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
  static async getStars (userId) {
    let starredArtists, starredSongs

    // get starred artists
    {
      const q = squel.select()
        .from('artistStars')
        .field('artistId')
        .where('userId = ?', userId)

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      starredArtists = rows.map(row => row.artistId)
    }

    // get starred songs
    {
      const q = squel.select()
        .from('songStars')
        .field('songId')
        .where('userId = ?', userId)

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      starredSongs = rows.map(row => row.songId)
    }

    return { starredArtists, starredSongs }
  }

  /**
  * Gets artist and song star counts
  *
  * @return {Object}
  */
  static async getStarCounts () {
    const artists = {}
    const songs = {}

    // get artist star counts
    {
      const q = squel.select()
        .from('artistStars')
        .field('artistId')
        .field('COUNT(userId) AS count')
        .group('artistId')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      rows.forEach(row => { artists[row.artistId] = row.count })
    }

    // get song star counts
    {
      const q = squel.select()
        .from('songStars')
        .field('songId')
        .field('COUNT(userId) AS count')
        .group('songId')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      rows.forEach(row => { songs[row.songId] = row.count })
    }

    return {
      artists,
      songs,
      version: Library.getStarCountsVersion(),
    }
  }

  static getLibraryVersion () { return _libraryVersion }
  static setLibraryVersion () { _libraryVersion = Date.now() }
  static getStarCountsVersion () { return _starCountsVersion }
  static setStarCountsVersion () { _starCountsVersion = Date.now() }
}

module.exports = Library
