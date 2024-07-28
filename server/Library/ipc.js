import Library from './Library.js'
import throttle from '@jcoreio/async-throttle'
import { SCANNER_WORKER_STATUS, LIBRARY_MATCH_SONG } from '../../shared/actionTypes.js'

/**
 * IPC action handlers
 */
export default function (io) {
  const emit = throttle(action => io.emit('action', action), 1000)

  return {
    [LIBRARY_MATCH_SONG]: async ({ payload }) => Library.matchSong(payload),
    [SCANNER_WORKER_STATUS]: action => emit(action),
  }
}
