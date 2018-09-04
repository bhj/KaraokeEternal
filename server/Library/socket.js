const db = require('sqlite')
const squel = require('squel')
const Library = require('./Library')

const {
  LIBRARY_PUSH_SONG,
  USER_SONG_STAR,
  USER_SONG_UNSTAR,
  _SUCCESS,
} = require('../../constants/actions')

const ACTION_HANDLERS = {
  [USER_SONG_STAR]: async (sock, { payload }, acknowledge) => {
    // @TODO use upsert
    // already starred?
    const q = squel.select()
      .from('starredSongs')
      .where('userId = ?', sock.user.userId)
      .where('songId = ?', payload.songId)

    const { text, values } = q.toParam()
    const res = await db.get(text, values)

    // not starred? then we need to!
    if (!res) {
      const q = squel.insert()
        .into('starredSongs')
        .set('userId', sock.user.userId)
        .set('songId', payload.songId)

      const { text, values } = q.toParam()
      await db.run(text, values)
    }

    // success
    acknowledge({ type: USER_SONG_STAR + _SUCCESS })

    // emit updated star count
    sock.server.emit('action', {
      type: LIBRARY_PUSH_SONG,
      payload: await Library.getSong(payload.songId),
    })
  },
  [USER_SONG_UNSTAR]: async (sock, { payload }, acknowledge) => {
    const q = squel.delete()
      .from('starredSongs')
      .where('userId = ?', sock.user.userId)
      .where('songId = ?', payload.songId)

    const { text, values } = q.toParam()
    await db.get(text, values)

    // success
    acknowledge({ type: USER_SONG_UNSTAR + _SUCCESS })

    // emit updated star count
    sock.server.emit('action', {
      type: LIBRARY_PUSH_SONG,
      payload: await Library.getSong(payload.songId),
    })
  }
}

module.exports = ACTION_HANDLERS
