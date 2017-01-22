const db = require('sqlite')
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
  let res

  // get all artists
  try {
    res = await db.all('SELECT artistId, name FROM artists ORDER BY name')
  } catch(err) {
    console.log(err)
    return Promise.reject(err)
  }

  // normalize results
  res.forEach(function(row){
    artists.result.push(row.artistId)
    artists.entities[row.artistId] = row
    artists.entities[row.artistId].songIds = []
  })

  // get all songs
  try {
    res = await db.all('SELECT songId, artistId, title, duration, plays, provider FROM songs ORDER BY title')
  } catch(err) {
    console.log(err)
    return Promise.reject(err)
  }

  // normalize results
  res.forEach(function(row){
    songs.result.push(row.songId)
    songs.entities[row.songId] = row

    // used in library view as parent/child LUT
    artists.entities[row.artistId].songIds.push(row.songId)
  })

  return { artists, songs }
}

module.exports = getLibrary
