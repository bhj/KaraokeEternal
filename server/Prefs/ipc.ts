import Prefs from './Prefs.js'
import { PATH_DATA_SET } from '../../shared/actionTypes.js'

/**
 * IPC action handlers
 */
export default function (io) { // eslint-disable-line @typescript-eslint/no-unused-vars
  return {
    [PATH_DATA_SET]: ({ payload }) => Prefs.setPathData(payload.pathId, '', payload.data),
  }
}
