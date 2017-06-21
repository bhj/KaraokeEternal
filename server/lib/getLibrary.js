const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:library:get')

async function getLibrary (find = {}, providerData = false) {
  let artists = {
    result: [],
    entities: {}
  }
  let songs = {
    result: [],
    entities: {}
  }

  // first query: songs
  try {
    const q = squel.select()
      .field('songId, artistId, title, duration, provider')
      .field('COUNT(stars.userId) AS stars')
      .from('songs')
      .left_join('stars USING(songId)')
      .group('songId')
      .order('title')

    // off by default since it requires extra processing
    if (providerData) {
      q.field('providerData')
    }

    // artistId filter
    if (typeof find.artistId !== 'undefined') {
      q.where('artistId = ?', find.artistId)
    }

    // other filters
    Object.keys(find).map(key => {
      if (key === 'providerData' && typeof find.providerData === 'object') {
        Object.keys(find.providerData).map(i => {
          q.where(`json_extract(providerData, '$.${i}') = ?`, find.providerData[i])
        })
      } else if (key !== 'artistId') {
        q.where(`${key} = ?`, find[key])
      }
    })

    // log(q.toString())
    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    // normalize results
    rows.forEach(function (row) {
      if (providerData) {
        row.providerData = JSON.parse(row.providerData)
      }

      songs.result.push(row.songId)
      songs.entities[row.songId] = row

      // used in library view as parent/child LUT
      if (typeof artists.entities[row.artistId] === 'undefined') {
        artists.entities[row.artistId] = {
          songIds: [],
        }
      }

      artists.entities[row.artistId].songIds.push(row.songId)
    })
  } catch (err) {
    log(err.message)
    return Promise.reject(err)
  }

  // second query: artists
  try {
    const q = squel.select()
      .from('artists')
      .order('name')

    // artistId filter
    if (typeof find.artistId !== 'undefined') {
      q.where('artistId = ?', find.artistId)
      delete find.artistId
    }

    // if other filters are present we'll need to
    // only include songs returned in first query
    if (Object.keys(find).length) {
      q.where('artistId IN ?', songs.result.map(songId => songs.entities[songId].artistId))
    }

    // log(q.toString())
    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    // normalize results
    rows.forEach(function (row) {
      artists.result.push(row.artistId)
      // merge with the LUT from first query
      artists.entities[row.artistId] = Object.assign(artists.entities[row.artistId], row)
    })
  } catch (err) {
    log(err.message)
    return Promise.reject(err)
  }

  log('retrieved %s artists, %s songs', artists.result.length, songs.result.length)
  return { artists, songs }
}

module.exports = getLibrary
