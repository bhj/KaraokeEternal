import getLogger from '../lib/Log.js'
import Media from './Media.js'
import Queue from '../Queue/Queue.js'
import Rooms from '../Rooms/Rooms.js'
import { isValidReplayGain } from '../lib/ReplayGain.js'
import { PITCH_SEMITONES_MAX, PITCH_SEMITONES_MIN } from '../../shared/types.js'
import { MEDIA_PITCH_SET, MEDIA_RG_SET, QUEUE_PUSH, _ERROR, _SUCCESS } from '../../shared/actionTypes.js'

const log = getLogger(`server[${process.pid}]`)

/**
 * Emit the queue of each room that has an item for the media, so clients pick up
 * its new stored values. Rooms that aren't singing it have nothing to update.
 */
const pushQueuesWithMedia = (io, mediaId: number) => {
  for (const { room, roomId } of Rooms.getActive(io)) {
    const queue = Queue.get(roomId)

    if (Object.values(queue.entities).some(item => item.mediaId === mediaId)) {
      io.to(room).emit('action', { type: QUEUE_PUSH, payload: queue })
    }
  }
}

const ACTION_HANDLERS = {
  [MEDIA_PITCH_SET]: (sock, { payload }, acknowledge) => {
    // the default applies to every room, for every future play
    if (!sock.user.isAdmin) {
      return acknowledge({
        type: MEDIA_PITCH_SET + _ERROR,
        error: 'Unauthorized',
      })
    }

    const { mediaId, pitch } = payload

    // a client could otherwise store a default that makes every future play
    // of this file unlistenable
    if (!Number.isInteger(mediaId) || !Number.isInteger(pitch)
      || pitch < PITCH_SEMITONES_MIN || pitch > PITCH_SEMITONES_MAX) {
      return acknowledge({
        type: MEDIA_PITCH_SET + _ERROR,
        error: 'Invalid pitch',
      })
    }

    // no-op if the media is gone or already has this value, which also bounds
    // the broadcast below to writes that changed something
    const isChanged = Media.setPitch(mediaId, pitch)

    acknowledge({ type: MEDIA_PITCH_SET + _SUCCESS })
    if (!isChanged) return

    log.info('mediaId %s: default pitch=%s (from %s)', mediaId, pitch, sock.user.name)

    pushQueuesWithMedia(sock.server, mediaId)
  },

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
    pushQueuesWithMedia(sock.server, mediaId)
  },
}

export default ACTION_HANDLERS
