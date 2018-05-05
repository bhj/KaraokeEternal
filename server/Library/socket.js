const db = require('sqlite')
const squel = require('squel')
const Library = require('./Library')

const {
  LIBRARY_PUSH_SONG,
  SONG_TOGGLE_STARRED,
} = require('../../constants/actions')

const ACTION_HANDLERS = {
  [SONG_TOGGLE_STARRED]: async (sock, { payload }, acknowledge) => {
    // already starred?
    try {
      const q = squel.delete()
        .from('stars')
        .where('userId = ?', sock.user.userId)
        .where('songId = ?', payload.songId)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (res.stmt.changes !== 1) {
        // song wasn't starred, so now we need to!
        const q = squel.insert()
          .into('stars')
          .set('userId', sock.user.userId)
          .set('songId', payload.songId)

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
        .where('userId = ?', sock.user.userId)

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      acknowledge({
        type: SONG_TOGGLE_STARRED + '_SUCCESS',
        payload: rows.map(row => row.songId),
      })
    } catch (err) {
      return Promise.reject(err)
    }

    // emit updated star count
    try {
      sock.server.emit('action', {
        type: LIBRARY_PUSH_SONG,
        payload: await Library.getSong(payload.songId),
      })
    } catch (err) {
      return Promise.reject(err)
    }
  },
}

module.exports = ACTION_HANDLERS
