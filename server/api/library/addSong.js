const db = require('sqlite')
const debug = require('debug')
const log = debug('app:library:addSong')

async function addSong(song) {
  log('new song: %s', JSON.stringify(song))

  if (!song || !song.artist || !song.title || !song.duration) {
    return Promise.reject(new Error('invalid song data'))
  }

  // does the artist already exist?
  let artistId
  let row = await db.get('SELECT * FROM artists WHERE name = ?', song.artist)

  if (row) {
    log('matched artist: %s', row.name)
    song.artistId = row.artistId
  } else {
    log('new artist: %s', song.artist)

    try {
      let res = await db.run('INSERT INTO artists(name) VALUES (?)', song.artist)
      song.artistId = res.stmt.lastID
    } catch(err) {
      return Promise.reject(err)
    }
  }

  // prep song data
  delete song.artist
  song.plays = 0
  song.meta = JSON.stringify(song.meta || {})
  let res

  try {
    const cols = Object.keys(song)
    const data = cols.map(i => song[i])
    const placeholders = '?,'.repeat(cols.length-1) + '?'

    res = await db.run(`INSERT INTO songs(${cols}) VALUES (${placeholders})`, data)

    if (!Number.isInteger(res.stmt.lastID)) {
      throw new Error('got invalid lastID')
    }
  } catch(err) {
    return Promise.reject(err)
  }

  return Promise.resolve(res.stmt.lastID)
}

module.exports = addSong
