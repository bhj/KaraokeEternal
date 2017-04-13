const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:library:search')

async function getSongs (params = {}) {
  const songs = {
    result: [],
    entities: {}
  }

  const q = squel.select()
    .field('songs.*')
    .from('songs')

  Object.keys(params).map(key => {
    if (key === 'providerData' && typeof params.providerData === 'object') {
      Object.keys(params.providerData).map(i => {
        q.where(`json_extract(providerData, '$.${i}') = ?`, params.providerData[i])
      })
    } else {
      q.where(`${key} = ?`, params[key])
    }
  })

  // starred count
  q.field('COUNT(stars.userId) AS stars')
    .left_join('stars USING(songId)')
    .group('songId')

  // get songs
  try {
    // log(q.toString())
    const { text, values } = q.toParam()
    const rows = await db.all(text, values)

    // normalize results
    rows.forEach(function (row) {
      songs.result.push(row.songId)
      songs.entities[row.songId] = row
    })
  } catch (err) {
    log(err.message)
    return Promise.reject(err)
  }

  // log('%s result' + (songs.result.length === 1 ? '' : 's'), songs.result.length)
  return songs
}

module.exports = getSongs
