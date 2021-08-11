import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from 'reselect'
import QueueList from './QueueList'
import { requestPlay, requestPause, requestPlayNext } from 'store/modules/status'
import { showSongInfo, closeSongInfo } from 'store/modules/songInfo'
import { queueSong, removeItem } from '../../modules/queue'
import getOrderedQueue from '../../selectors/getOrderedQueue'
import { toggleSongStarred } from 'store/modules/userStars'
import { showErrorMessage } from 'store/modules/ui'

const getPlayerHistoryJSON = (state) => state.status.historyJSON
const getPosition = (state) => state.status.position
const getQueue = (state) => getOrderedQueue(state)
const getQueueId = (state) => state.status.queueId
const getSongs = (state) => state.songs
const getStarredSongs = (state) => ensureState(state.userStars).starredSongs

const getPlayerHistory = createSelector(
  [getPlayerHistoryJSON],
  (history) => JSON.parse(history)
)

const getWaits = createSelector(
  [getQueue, getQueueId, getPosition, getSongs],
  (queue, queueId, position, songs) => {
    const curIdx = queue.result.indexOf(queueId)
    const waits = {}
    let curWait = 0
    let nextWait = 0

    queue.result.forEach((queueId, i) => {
      const songId = queue.entities[queueId].songId
      let duration = 0
      if (queue.entities[queueId].youtubeVideoId) duration = queue.entities[queueId].youtubeVideoDuration
      else if (songs.entities[songId]) duration = songs.entities[songId].duration

      if (i === curIdx) {
        // currently playing
        nextWait = Math.round(duration - position)
      } else if (i > curIdx) {
        // upcoming
        curWait += nextWait
        nextWait = duration
      }

      waits[queueId] = curWait
    })

    return waits
  }
)

const mapStateToProps = (state) => {
  return {
    artists: state.artists,
    errorMessage: state.status.errorMessage,
    isAtQueueEnd: state.status.isAtQueueEnd,
    isErrored: state.status.isErrored,
    playerHistory: getPlayerHistory(state),
    position: state.status.position,
    queue: getOrderedQueue(state),
    queueId: state.status.queueId,
    songs: state.songs,
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
