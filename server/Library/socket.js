import Library from './Library.js'
import { STAR_SONG, SONG_STARRED, UNSTAR_SONG, SONG_UNSTARRED, _SUCCESS } from '../../shared/actionTypes.ts'

const ACTION_HANDLERS = {
  [STAR_SONG]: async (sock, { payload }, acknowledge) => {
    const changes = await Library.starSong(payload.songId, sock.user.userId)

    // success
    acknowledge({ type: STAR_SONG + _SUCCESS })

    // tell all clients (some users may be in multiple rooms)
    if (changes) {
      sock.server.emit('action', {
        type: SONG_STARRED,
        payload: {
          userId: sock.user.userId,
          songId: payload.songId,
        },
      })
    }
  },
  [UNSTAR_SONG]: async (sock, { payload }, acknowledge) => {
    const changes = await Library.unstarSong(payload.songId, sock.user.userId)

    // success
    acknowledge({ type: UNSTAR_SONG + _SUCCESS })

    if (changes) {
      // tell all clients (some users may be in multiple rooms)
      sock.server.emit('action', {
        type: SONG_UNSTARRED,
        payload: {
          userId: sock.user.userId,
          songId: payload.songId,
        },
      })
    }
  },
}

export default ACTION_HANDLERS
