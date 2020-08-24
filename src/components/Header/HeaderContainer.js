import { connect } from 'react-redux'
import Header from './Header'
import { createSelector } from 'reselect'
import { requestScanStop } from 'store/modules/prefs'
import getOrderedQueue from 'routes/Queue/selectors/getOrderedQueue'

const getIsAtQueueEnd = (state) => state.status.isAtQueueEnd
const getPosition = (state) => state.status.position
const getQueueId = (state) => state.status.queueId
const getSongs = (state) => state.songs
const getUserId = (state) => state.user.userId

const getUserWait = createSelector(
  [getOrderedQueue, getSongs, getQueueId, getPosition, getUserId],
  (queue, songs, queueId, pos, userId) => {
    if (!queue.entities[queueId]) return // queueItem not found
    if (!songs.entities[queue.entities[queueId].songId]) return // song not found

    // current song's remaining time
    let wait = Math.round(songs.entities[queue.entities[queueId].songId].duration - pos)

    const curIdx = queue.result.indexOf(queueId)

    for (let i = curIdx + 1; i < queue.result.length; i++) {
      if (queue.entities[queue.result[i]] && queue.entities[queue.result[i]].userId === userId) {
        return wait
      }

      wait += songs.entities[queue.entities[queue.result[i]].songId].duration
    }
  }
)

const getStatusProps = createSelector(
  [getOrderedQueue, getQueueId, getIsAtQueueEnd, getUserId],
  (queue, queueId, isAtQueueEnd, userId) => {
    const { result, entities } = queue
    const curIdx = result.indexOf(queueId)
    const curItem = entities[queueId]

    return {
      isUpNext: result[curIdx + 1] ? entities[result[curIdx + 1]].userId === userId : false,
      isUpNow: curItem ? !isAtQueueEnd && curItem.userId === userId : false,
    }
  }
)

const mapStateToProps = (state) => {
  return {
    ...getStatusProps(state),
    wait: getUserWait(state),
    isAdmin: state.user.isAdmin,
    isPlayer: state.location.pathname === '/player',
    isPlayerPresent: state.status.isPlayerPresent,
    isScanning: state.prefs.isScanning,
    scannerText: state.prefs.scannerText,
    scannerPct: state.prefs.scannerPct,
  }
}

const mapActionCreators = {
  requestScanStop,
}

export default connect(mapStateToProps, mapActionCreators, null, { forwardRef: true })(Header)
