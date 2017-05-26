const db = require('sqlite')
const squel = require('squel')
const getLibrary = require('../lib/getLibrary')

const {
  SONG_UPDATE,
  TOGGLE_SONG_STARRED
} = require('../constants')

const ACTION_HANDLERS = {
  [TOGGLE_SONG_STARRED]: async (ctx, { payload }) => {
    // already starred?
    try {
      const q = squel.delete()
        .from('stars')
        .where('songId = ?', payload)
        .where('userId = ?', ctx.user.userId)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (res.stmt.changes !== 1) {
        // song wasn't starred, so now we need to!
        const q = squel.insert()
          .into('stars')
          .set('songId', payload)
          .set('userId', ctx.user.userId)

        const { text, values } = q.toParam()
        await db.run(text, values)
      }
    } catch (err) {
      return Promise.reject(err)
    }

    // success; send back new starred list
    try {
      const q = squel.select()
        .from('stars')
        .field('songId')
        .where('userId = ?', ctx.user.userId)

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      const starredSongs = []
      rows.forEach(row => {
        starredSongs.push(row.songId)
      })

      ctx.acknowledge({
        type: TOGGLE_SONG_STARRED + '_SUCCESS',
        payload: starredSongs,
      })
    } catch (err) {
      return Promise.reject(err)
    }

    // emit updated star count
    try {
      const res = await getLibrary({
        songId: payload,
      })

      if (res.songs.result.length !== 1) {
        throw new Error(res.songs.result.length + ' results (expected 1)')
      }

      ctx.sock.server.emit('action', {
        type: SONG_UPDATE,
        payload: res.songs.entities[res.songs.result[0]],
      })
    } catch (err) {
      return Promise.reject(err)
    }
  },
}

module.exports = ACTION_HANDLERS
