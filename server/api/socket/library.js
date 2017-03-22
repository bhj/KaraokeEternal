const db = require('sqlite')
const squel = require('squel')
const log = require('debug')('app:socket:library')

const searchLibrary = require('../../lib/search')
const getLibrary = require('../../lib/get')

const {
  SONG_UPDATE,
  TOGGLE_SONG_STARRED
} = require('../constants')

const ACTION_HANDLERS = {
  [TOGGLE_SONG_STARRED]: async (ctx, {payload}) => {
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
    } catch(err) {
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
        type: TOGGLE_SONG_STARRED+'_SUCCESS',
        payload: starredSongs,
      })
    } catch(err) {
      return Promise.reject(err)
    }

    // emit updated star count to room
    try {
      const res = await searchLibrary({
        songId: payload,
      })

      if (res.result.length !== 1) {
        throw new Error(res.result.length+' results (expected 1)')
      }

      ctx.io.to(ctx.user.roomId).emit('action', {
        type: SONG_UPDATE,
        payload: res.entities[res.result[0]],
      })
    } catch(err) {
      return Promise.reject(err)
    }
  },
}

module.exports = {
  ACTION_HANDLERS,
  getLibrary,
}
