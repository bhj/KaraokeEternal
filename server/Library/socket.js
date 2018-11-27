const db = require('sqlite')
const squel = require('squel')
const Library = require('./Library')
const {
  STAR_SONG,
  SONG_STARRED,
  UNSTAR_SONG,
  SONG_UNSTARRED,
  _SUCCESS,
} = require('../../shared/actionTypes')

const ACTION_HANDLERS = {
  [STAR_SONG]: async (sock, { payload }, acknowledge) => {
    // @TODO use upsert
    const q = squel.insert()
      .into('songStars')
      .set('userId', sock.user.userId)
      .set('songId', payload.songId)

    const { text, values } = q.toParam()
    await db.run(text, values)

    // success
    acknowledge({ type: STAR_SONG + _SUCCESS })

    // update star count version
    Library.setStarCountsVersion()

    // tell all clients (some users may be in multiple rooms)
    sock.server.emit('action', {
      type: SONG_STARRED,
      payload: {
        userId: sock.user.userId,
        songId: payload.songId,
        version: Library.getStarCountsVersion(),
      },
    })
  },
  [UNSTAR_SONG]: async (sock, { payload }, acknowledge) => {
    const q = squel.delete()
      .from('songStars')
      .where('userId = ?', sock.user.userId)
      .where('songId = ?', payload.songId)

    const { text, values } = q.toParam()
    await db.get(text, values)

    // success
    acknowledge({ type: UNSTAR_SONG + _SUCCESS })

    // update star count version
    Library.setStarCountsVersion()

    // tell all clients (some users may be in multiple rooms)
    sock.server.emit('action', {
      type: SONG_UNSTARRED,
      payload: {
        userId: sock.user.userId,
        songId: payload.songId,
        version: Library.getStarCountsVersion(),
      },
    })
  }
}

module.exports = ACTION_HANDLERS
