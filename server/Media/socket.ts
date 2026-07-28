import getLogger from '../lib/Log.js'
import Media from './Media.js'
import Queue from '../Queue/Queue.js'
import Rooms from '../Rooms/Rooms.js'
import { isValidReplayGain } from '../lib/ReplayGain.js'
import { MEDIA_RG_SET, QUEUE_PUSH, _ERROR, _SUCCESS } from '../../shared/actionTypes.js'

const log = getLogger(`server[${process.pid}]`)

const ACTION_HANDLERS = {
  [MEDIA_RG_SET]: (sock, { payload }, acknowledge) => {
    // matches the media route's own gate: whoever can fetch the bytes can
    // report on them
    if (!sock.user.isAdmin) {
      return acknowledge({
        type: MEDIA_RG_SET + _ERROR,
        error: 'Unauthorized',
      })
    }

    const { mediaId, rgTrackGain, rgTrackPeak } = payload

    if (!Number.isInteger(mediaId) || !isValidReplayGain(rgTrackGain, rgTrackPeak)) {
      return acknowledge({
        type: MEDIA_RG_SET + _ERROR,
        error: 'Invalid ReplayGain values',
      })
    }

    // no-op if the media is gone or already has values; each mediaId can only
    // succeed once, which also bounds the broadcasts below
    if (!Media.setReplayGain(mediaId, rgTrackGain, rgTrackPeak)) {
      return acknowledge({ type: MEDIA_RG_SET + _SUCCESS })
    }

    log.info('mediaId %s: rgTrackGain=%s rgTrackPeak=%s (from %s)',
      mediaId, rgTrackGain, rgTrackPeak, sock.user.name)

    acknowledge({ type: MEDIA_RG_SET + _SUCCESS })

    // the reporting player already has the values; this is only to keep other
    // clients' queues consistent
    for (const { room, roomId } of Rooms.getActive(sock.server)) {
      const queue = Queue.get(roomId)

      if (Object.values(queue.entities).some(item => item.mediaId === mediaId)) {
        sock.server.to(room).emit('action', { type: QUEUE_PUSH, payload: queue })
      }
    }
  },
}

export default ACTION_HANDLERS
