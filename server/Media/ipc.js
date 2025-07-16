import Media from './Media.js'
import { MEDIA_ADD, MEDIA_CLEANUP, MEDIA_REMOVE, MEDIA_UPDATE } from '../../shared/actionTypes.ts'

/**
 * IPC action handlers
 */
export default function () {
  return {
    [MEDIA_ADD]: async ({ payload }) => Media.add(payload),
    [MEDIA_CLEANUP]: Media.cleanup,
    [MEDIA_REMOVE]: async ({ payload }) => Media.remove(payload),
    [MEDIA_UPDATE]: async ({ payload }) => Media.update(payload),
  }
}
