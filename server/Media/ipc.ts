import Media from './Media.js'
import { MEDIA_ADD, MEDIA_CLEANUP, MEDIA_REMOVE, MEDIA_UPDATE } from '../../shared/actionTypes.js'

/**
 * IPC action handlers
 */
export default function (io) { // eslint-disable-line @typescript-eslint/no-unused-vars
  return {
    [MEDIA_ADD]: ({ payload }) => Media.add(payload),
    [MEDIA_CLEANUP]: Media.cleanup,
    [MEDIA_REMOVE]: ({ payload }) => Media.remove(payload),
    [MEDIA_UPDATE]: ({ payload }) => Media.update(payload),
  }
}
