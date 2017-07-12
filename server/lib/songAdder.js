const db = require('sqlite')
const squel = require('squel')
const debug = require('debug')
const log = debug('app:library:addSong')

function getSongAdder (emitLibrary) {
  return async function (song) {
    const { artist, title, duration, provider, providerData } = song
    log('new song: %s', JSON.stringify(song))

    if (!artist || !title || !duration || !provider) {
      return Promise.reject(new Error('invalid song data'))
    }

    // does the artist already exist?
    let row, artistId

    try {
      const q = squel.select()
        .from('artists')
        .where('name = ?', artist)

      const { text, values } = q.toParam()
      row = await db.get(text, values)
    } catch (err) {
      return Promise.reject(err)
    }

    if (row) {
      log('matched artist: %s', row.name)
      artistId = row.artistId
    } else {
      log('new artist: %s', artist)

      try {
        const q = squel.insert()
          .into('artists')
          .set('name', artist)

        const { text, values } = q.toParam()
        const res = await db.run(text, values)

        if (!Number.isInteger(res.stmt.lastID)) {
          throw new Error('invalid lastID after artist insert')
        }

        artistId = res.stmt.lastID
      } catch (err) {
        return Promise.reject(err)
      }
    }

    // insert data
    let data = {
      artistId,
      title,
      duration,
      provider,
      providerData: JSON.stringify(typeof providerData === 'object' ? providerData : {}),
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

      // emit updated library
      await emitLibrary()

      return Promise.resolve(res.stmt.lastID)
    } catch (err) {
      log(err)
      return Promise.reject(err)
    }
  }
}

module.exports = getSongAdder
