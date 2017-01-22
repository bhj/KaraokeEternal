const db = require('sqlite')
const debug = require('debug')
const log = debug('app:library:addSong')

const LIBRARY_CHANGE = 'library/LIBRARY_CHANGE'

async function addSong(song) {
  if (!song || !song.artist || !song.title || !song.duration) {
    return Promise.reject(new Error('invalid song data'))
  }

  log('new song: %s', JSON.stringify({artist: song.artist, title: song.title, duration: song.duration}))

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

  // insert data
  let data = {
    artistId: song.artistId,
    title: song.title,
    duration: song.duration,
    plays: 0,
    provider: song.provider,
    provider_json: typeof song.meta === 'object' ? JSON.stringify(song.meta) : {},
  }

  try {
    const cols = Object.keys(data)
    const vals = cols.map(i => data[i])
    const placeholders = '?,'.repeat(cols.length-1) + '?'

    let res = await db.run(`INSERT INTO songs(${cols}) VALUES (${placeholders})`, vals)

    if (!Number.isInteger(res.stmt.lastID)) {
      throw new Error('got invalid lastID')
    }

    return Promise.resolve(res.stmt.lastID)
  } catch(err) {
    return Promise.reject(err)
  }
}

module.exports = addSong
