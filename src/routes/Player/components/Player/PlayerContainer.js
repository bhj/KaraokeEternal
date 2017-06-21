import Player from './Player'
import { connect } from 'react-redux'
import { requestPlayNext } from 'store/modules/status'
import {
  emitStatus,
  emitError,
  emitLeave,
  cancelStatus,
  getMedia,
  getMediaSuccess,
} from '../../modules/player'

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
  const { player, queue } = state

  return {
    queueId: player.queueId,
    queueItem: queue.entities[player.queueId],
    isAtQueueEnd: player.isAtQueueEnd,
    volume: player.volume,
    isPlaying: player.isPlaying,
    isFetching: player.isFetching,
    isErrored: typeof state.status.errors[state.status.queueId] !== 'undefined',
    // timestamp pass-through triggers status emission for each received command
    lastCommandAt: player.lastCommandAt,
  }
}

export default connect(mapStateToProps, mapActionCreators)(Player)
