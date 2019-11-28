const db = require('sqlite')
const sql = require('sqlate')
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
    const fields = new Map()
    fields.set('userId', sock.user.userId)
    fields.set('songId', payload.songId)

    const query = sql`
      INSERT OR IGNORE INTO songStars ${sql.tuple(Array.from(fields.keys()).map(sql.column))}
      VALUES ${sql.tuple(Array.from(fields.values()))}
    `
    const res = await db.run(String(query), query.parameters)

    // success
    acknowledge({ type: STAR_SONG + _SUCCESS })

    if (res.stmt.changes) {
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
    }
  },
  [UNSTAR_SONG]: async (sock, { payload }, acknowledge) => {
    const query = sql`
      DELETE FROM songStars
      WHERE userId = ${sock.user.userId} AND songId = ${payload.songId}
    `
    const res = await db.run(String(query), query.parameters)

    // success
    acknowledge({ type: UNSTAR_SONG + _SUCCESS })

    if (res.stmt.changes) {
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
}

module.exports = ACTION_HANDLERS
