import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import QueueList from './QueueList'
import { showErrorMessage } from 'store/modules/ui'
import { requestPlay, requestPause, requestPlayNext } from 'store/modules/status'
import { queueSong, removeItem } from '../../modules/queue'

const getQueue = (state) => state.queue
const getCurId = (state) => state.status.queueId
const getCurPos = (state) => state.status.position

const getWaits = createSelector(
  [getQueue, getCurId, getCurPos],
  (queue, curId, curPos) => {
    const waits = {}
    let curWait = 0
    let nextWait = 0

    queue.result.forEach(i => {
      const duration = queue.entities[i].duration

      if (i === curId) {
        // currently playing
        nextWait = Math.round(duration - curPos)
      } else if (i > curId) {
        curWait += nextWait
        nextWait = duration
      }

      waits[i] = curWait
    })

    return waits
  }
)

const mapStateToProps = (state) => {
  return {
    queue: state.queue,
    curId: state.status.queueId,
    curPos: state.status.position,
    isAtQueueEnd: state.status.isAtQueueEnd,
    waits: getWaits(state),
    errors: state.status.errors,
    artists: state.library.artists,
    songs: state.library.songs,
    // user
    user: state.user,
  }
}

const mapActionCreators = {
  queueSong,
  removeItem,
  requestPlay,
  requestPlayNext,
  requestPause,
  showErrorMessage,
}

export default connect(mapStateToProps, mapActionCreators)(QueueList)
