import PlayerView from '../components/PlayerView'
import { connect } from 'react-redux'
import { requestPlayNext } from 'store/modules/room'
import {
  emitStatus,
  emitError,
  emitLeave,
  cancelStatus,
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
  const { player } = state

  return {
    song: state.queue.entities[player.queueId],
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
