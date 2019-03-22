import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from 'reselect'
import QueueList from './QueueList'
import { showErrorMessage, showSongInfo, closeSongInfo } from 'store/modules/ui'
import { requestPlay, requestPause, requestPlayNext } from 'store/modules/status'
import { queueSong, removeItem } from '../../modules/queue'
import { toggleSongStarred } from 'store/modules/userStars'

const getQueue = (state) => ensureState(state.queue)
const getCurId = (state) => state.status.queueId
const getCurPos = (state) => state.status.position
const getStarredSongs = (state) => ensureState(state.userStars).starredSongs

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
    artists: state.library.artists,
    curId: state.status.queueId,
    curPos: state.status.position,
    errorMessage: state.status.errorMessage,
    isAtQueueEnd: state.status.isAtQueueEnd,
    isErrored: state.status.isErrored,
    queue: ensureState(state.queue),
    songs: state.library.songs,
    starredSongs: getStarredSongs(state),
    user: state.user,
    waits: getWaits(state),
  }
}

const mapActionCreators = {
  closeSongInfo,
  queueSong,
  removeItem,
  requestPlay,
  requestPlayNext,
  requestPause,
  showErrorMessage,
  showSongInfo,
  toggleSongStarred,
}

export default connect(mapStateToProps, mapActionCreators)(QueueList)
