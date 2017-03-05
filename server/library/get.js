const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:library:get')

async function getLibrary() {
  let artists = {
    result: [],
    entities: {}
  }
  let songs = {
    result: [],
    entities: {}
  }

  // get all artists
  try {
    const q = squel.select()
      .from('artists')
      .field('artistId, name')
      .order('name')

    // log(q.toString())
    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    // normalize results
    rows.forEach(function(row){
      artists.result.push(row.artistId)
      artists.entities[row.artistId] = row
      artists.entities[row.artistId].songIds = []
    })
  } catch(err) {
    log(err.message)
    return Promise.reject(err)
  }

  // get all songs
  try {
    const q = squel.select()
      .from('songs')
      .field('songId, artistId, title, duration, provider')
      .order('title')

    // log(q.toString())
    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    // normalize results
    rows.forEach(function(row){
      songs.result.push(row.songId)
      songs.entities[row.songId] = row

      // used in library view as parent/child LUT
      artists.entities[row.artistId].songIds.push(row.songId)
    })
  } catch(err) {
    log(err.message)
    return Promise.reject(err)
  }

  return { artists, songs }
}

module.exports = getLibrary
