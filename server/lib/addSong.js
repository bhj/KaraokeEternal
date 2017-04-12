const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:library:addSong')

async function addSong (song) {
  if (!song || !song.artist || !song.title || !song.duration) {
    return Promise.reject(new Error('invalid song data'))
  }

  log('new song: %s', JSON.stringify({ artist: song.artist, title: song.title, duration: song.duration }))

  // does the artist already exist?
  let row
  try {
    const q = squel.select()
      .from('artists')
      .where('name = ?', song.artist)

    const { text, values } = q.toParam()
    row = await db.get(text, values)
  } catch (err) {
    return Promise.reject(err)
  }

  if (row) {
    log('matched artist: %s', row.name)
    song.artistId = row.artistId
  } else {
    log('new artist: %s', song.artist)

    try {
      const q = squel.insert()
        .into('artists')
        .set('name', song.artist)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (!Number.isInteger(res.stmt.lastID)) {
        throw new Error('invalid lastID after artist insert')
      }

      song.artistId = res.stmt.lastID
    } catch (err) {
      return Promise.reject(err)
    }
  }

  // insert data
  let data = {
    artistId: song.artistId,
    title: song.title,
    duration: song.duration,
    provider: song.provider,
    provider_json: typeof song.meta === 'object' ? JSON.stringify(song.meta) : {},
  }

  try {
    const q = squel.insert()
      .into('songs')

    Object.keys(data).forEach(key => {
      q.set(key, data[key])
    })

    const { text, values } = q.toParam()
    const res = await db.run(text, values)

    if (!Number.isInteger(res.stmt.lastID)) {
      throw new Error('got invalid lastID after song insert')
    }

    return Promise.resolve(res.stmt.lastID)
  } catch (err) {
    return Promise.reject(err)
  }
}

module.exports = addSong
