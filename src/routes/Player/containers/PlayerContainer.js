import PlayerView from '../components/PlayerView'
import { connect } from 'react-redux'
import {
  emitStatus,
  emitError,
  emitLeave,
  cancelStatus,
  requestPlayNext,
  getMedia,
  getMediaSuccess,
} from '../modules/player'

const mapActionCreators = {
  emitStatus,
  emitError,
  emitLeave,
  cancelStatus,
  requestPlayNext,
  getMedia,
  getMediaSuccess,
}

const mapStateToProps = (state) => {
  const { queue, player } = state
  let songId, song

  if (queue.entities[player.queueId]) {
    songId = queue.entities[player.queueId].songId
    song = state.library.songs.entities[songId]
  }

  return {
    song,
    queueId: player.queueId,
    volume: player.volume,
    isAtQueueEnd: player.isAtQueueEnd,
    isPlaying: player.isPlaying,
    isFetching: player.isFetching,
    isErrored: typeof state.room.errors[state.room.queueId] !== 'undefined',
    lastTimestamp: player.lastTimestamp,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
