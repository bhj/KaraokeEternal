const db = require('sqlite')
const squel = require('squel')
const Media = require('../Media')

const {
  LIBRARY_PUSH,
  TOGGLE_SONG_STARRED,
} = require('../../constants/actions')

const ACTION_HANDLERS = {
  [TOGGLE_SONG_STARRED]: async (sock, { payload }, acknowledge) => {
    // already starred?
    try {
      const q = squel.delete()
        .from('stars')
        .where('mediaId = ?', payload)
        .where('userId = ?', sock.user.userId)

      const { text, values } = q.toParam()
      const res = await db.run(text, values)

      if (res.stmt.changes !== 1) {
        // song wasn't starred, so now we need to!
        const q = squel.insert()
          .into('stars')
          .set('mediaId', payload)
          .set('userId', sock.user.userId)

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
        .field('mediaId')
        .where('userId = ?', sock.user.userId)

      const { text, values } = q.toParam()
      const rows = await db.all(text, values)

      const starredSongs = []
      rows.forEach(row => {
        starredSongs.push(row.mediaId)
      })

      acknowledge({
        type: TOGGLE_SONG_STARRED + '_SUCCESS',
        payload: starredSongs,
      })
    } catch (err) {
      return Promise.reject(err)
    }

    // emit updated star count
    try {
      sock.server.emit('action', {
        type: LIBRARY_PUSH,
        payload: await Media.getLibrary(),
      })
    } catch (err) {
      return Promise.reject(err)
    }
  },
}

module.exports = ACTION_HANDLERS
