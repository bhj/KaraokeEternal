const path = require('path')
const db = require('sqlite')
const squel = require('squel')
const log = require('../lib/logger')('Library')
let _libraryVersion = Date.now()
let _starCountsVersion = Date.now()

class Library {
  /**
  * Get artists and songs in a format suitable for sending to clients
  * @return {Promise} Object with artists and songs normalized
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
        .field('duration, isPreferred')
        .field('songs.artistId AS artistId')
        .field('songs.songId AS songId')
        .field('songs.title AS title')
        .from('media')
        .join('songs USING (songId)')
        .join('paths USING (pathId)')
        .order('songs.titleNorm, paths.priority')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      for (const row of rows) {
        if (songs.entities[row.songId]) {
          if (row.isPreferred) {
            songs.entities[row.songId].duration = row.duration
          }

          songs.entities[row.songId].numMedia++
          continue
        }

        delete row.isPreferred // no need to send over the wire
        songs.entities[row.songId] = row
        songs.entities[row.songId].numMedia = 1
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
      const q = squel.select()
        .from('artists')
        .order('nameNorm')

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      for (const row of rows) {
        if (SongIdsByArtist[row.artistId]) {
          artists.result.push(row.artistId)
          artists.entities[row.artistId] = row
          artists.entities[row.artistId].songIds = SongIdsByArtist[row.artistId]
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
  * Get underlying media for a given song
  * @param  {number}  songId
  * @return {Promise} normalized media entries
  */
  static async getSong (songId) {
    const media = {
      result: [],
      entities: {},
    }

    const q = squel.select()
      .field('media.*')
      .field('paths.path')
      .field('songs.artistId, songs.songId, songs.title')
      .from('media')
      .where('songId = ?', songId)
      .join(squel.select()
        .from('paths')
        .group('pathId'),
      'paths', 'paths.pathId = media.pathId')
      .join('songs USING (songId)')
      .join('artists USING (artistId)')
      .order('paths.priority')

    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    rows.forEach(row => {
      media.result.push(row.mediaId)

      row.file = row.path + path.sep + row.relPath
      media.entities[row.mediaId] = row
    })

    return media
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
