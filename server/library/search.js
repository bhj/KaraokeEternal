const db = require('sqlite')
const debug = require('debug')
const log = debug('app:library:search')

async function searchLibrary(params = {}) {
  let sql, res
  let songs = {
    result: [],
    entities: {}
  }
  let where = []

  if (typeof params.meta === 'object') {
    Object.keys(params.meta).map(key => {
      let val = params.meta[key]
      if (typeof val === 'string') val = "'"+val+"'" // ugh
      where.push(`json_extract(meta, '$.${key}') = ${val}`)
    })
  }

  sql = 'SELECT * FROM songs'
  if (where.length) sql += ' WHERE ' + where.join(' AND ')
  sql += ' ORDER BY title'

  // get songs
  try {
    log(sql)
    res = await db.all(sql)
  } catch(err) {
    console.log(err)
    return Promise.reject(err)
  }

  // normalize results
  res.forEach(function(row){
    songs.result.push(row.songId)
    songs.entities[row.songId] = row
  })

  log('%s result(s)', songs.result.length)
  return songs
}

module.exports = searchLibrary
