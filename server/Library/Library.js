const db = require('sqlite')
const squel = require('squel')
const log = require('../lib/logger')('library')

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
        .field('COUNT(DISTINCT starredSongs.userId) AS numStars')
        .from('media')
        .join(squel.select()
          .from('paths')
          .field('MIN(paths.priority) AS priority')
          .field('pathId')
          .group('pathId'),
        'paths', 'media.pathId = paths.pathId')
        .join('songs USING (songId)')
        .join('artists USING (artistId)')
        .left_join('starredSongs USING(songId)')
        .group('songs.songId')
        .order('songs.title')

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
        .order('name')

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

    return { artists, songs }
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
      .field('COUNT(DISTINCT starredSongs.userId) AS numStars')
      .from('media')
      .join(squel.select()
        .from('paths')
        .field('MIN(paths.priority) AS priority')
        .field('pathId')
        .group('pathId'),
      'paths', 'media.pathId = paths.pathId')
      .join('songs USING (songId)')
      .join('artists USING (artistId)')
      .left_join('starredSongs USING(songId)')
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
   * Matches or creates artist and song for a given artist and title
   * @param  {object}  media  { artist, title }
   * @return {object}         { artistId, songId }
   */
  static async matchSong (artist, title) {
    let artistId, songId

    // match artist
    const search = [artist]

    // try with and without 'The'
    if (/^the /i.test(artist)) {
      search.push(artist.replace(/^the /i, ''))
    } else {
      search.push(`The ${artist}`)
    }

    {
      const q = squel.select()
        .from('artists')
        .where('name IN ? COLLATE NOCASE', search)

      const { text, values } = q.toParam()
      const row = await db.get(text, values)

      if (row) {
        // log.info('matched artist: %s', row.name)
        artistId = row.artistId
        artist = row.name
      }
    }

    // new artist?
    if (typeof artistId === 'undefined') {
      log.info('new artist: %s', artist)

      const q = squel.insert()
        .into('artists')
        .set('name', artist)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (!Number.isInteger(res.stmt.lastID)) {
        throw new Error('invalid artistId after insert')
      }

      artistId = res.stmt.lastID
    }

    // match title
    {
      const q = squel.select()
        .from('songs')
        .where('artistId = ?', artistId)
        .where('title = ? COLLATE NOCASE', title)

      const { text, values } = q.toParam()
      const row = await db.get(text, values)

      if (row) {
        // log.info('matched song: %s', row.title)
        songId = row.songId
        title = row.title
      }
    }

    // new song?
    if (typeof songId === 'undefined') {
      log.info('new song: %s', title)

      const q = squel.insert()
        .into('songs')
        .set('artistId', artistId)
        .set('title', title)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (!Number.isInteger(res.stmt.lastID)) {
        throw new Error('invalid songId after insert')
      }

      songId = res.stmt.lastID
    }

    return { artistId, artist, songId, title }
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
        .from('starredArtists')
        .field('artistId')
        .where('userId = ?', userId)

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      starredArtists = rows.map(row => row.artistId)
    }

    // get starred songs
    {
      const q = squel.select()
        .from('starredSongs')
        .field('songId')
        .where('userId = ?', userId)

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      starredSongs = rows.map(row => row.songId)
    }

    return { starredArtists, starredSongs }
  }
}

module.exports = Library
