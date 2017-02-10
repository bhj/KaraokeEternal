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

  Object.keys(params).map(key => {
    if (key === 'meta' && typeof params.meta === 'object') {
      Object.keys(params.meta).map(i => {
        let val = params.meta[i]
        if (typeof val === 'string') val = "'"+val+"'" // ugh
        where.push(`json_extract(provider_json, '$.${i}') = ${val}`)
      })
      return
    }

    where.push(`${key} = '${params[key]}'`)
  })

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
