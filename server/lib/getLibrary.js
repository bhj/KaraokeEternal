const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:library:get')

/**
 * Gets all artists/songs without detailed media info
 * (suitable for pushing out to non-admin users)
 *
 * @return {[object]}          Results normalized by artist and song
 */
async function getLibrary () {
  const artists = {
    result: [],
    entities: {}
  }
  const songs = {
    result: [],
    entities: {}
  }

  // First query: artists
  try {
    const q = squel.select()
      .from('artists')
      .order('name')

    // log(q.toString())
    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    // normalize results
    for (const row of rows) {
      artists.result.push(row.artistId)
      artists.entities[row.artistId] = row
      // prep LUT for songIds
      artists.entities[row.artistId].songIds = []
    }
  } catch (err) {
    log(err.message)
    return Promise.reject(err)
  }

  // Second query: media/songs
  //
  // This could probably be improved but writing a single query that properly
  // returns the right media item while handling enabled/disabled providers,
  // provider priority, per-song preferred media (with fallback if preferred
  // media's provider is disabled), etc. proved difficult. At the very least
  // this query avoids subqueries and should be relatively performant.
  try {
    const q = squel.select()
      .field('media.mediaId, media.songId, media.duration, media.provider, media.isPreferred')
      .field('songs.artistId, songs.title')
      .field('COUNT(stars.userId) AS numStars')
      .from('media')
      .join('providers ON (providers.name = media.provider)')
      .join('songs USING(songId)')
      .left_join('stars USING(songId)')
      .where('providers.isEnabled = 1')
      .group('mediaId')
      .order('providers.priority')
      .order('songs.title')

    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    // normalize and process results
    for (const row of rows) {
      if (typeof songs.entities[row.songId] === 'undefined') {
        // add songId to artist's LUT
        artists.entities[row.artistId].songIds.push(row.songId)

        songs.result.push(row.songId)
        songs.entities[row.songId] = row
        songs.entities[row.songId].numMedia = 1
      } else if (row.isPreffered === 1) {
        // The previous query should have returned media ordered by the
        // correct provider priority, so we only want to overwrite an
        // exisiting entry if this media's isPreferred flag is set.
        songs.entities[row.songId] = row
      }

      // increment song's media item count
      ++songs.entities[row.songId].numMedia
    }
  } catch (err) {
    log(err.message)
    return Promise.reject(err)
  }

  log('%s songs by %s artists', songs.result.length, artists.result.length)
  return { artists, songs }
}

module.exports = getLibrary
