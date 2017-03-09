const db = require('sqlite')
const squel = require('squel')
const log = require('debug')('app:socket:library')

const TOGGLE_SONG_STARRED = 'server/TOGGLE_SONG_STARRED'

const getLibrary = require('../../library/get')
const LIBRARY_CHANGE = 'library/LIBRARY_CHANGE'

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

    // send library
    ctx.io.to(ctx.user.roomId).emit('action', {
      type: LIBRARY_CHANGE,
      payload: await getLibrary(),
    })
  },
}

module.exports = {
  ACTION_HANDLERS,
  getLibrary,
}
