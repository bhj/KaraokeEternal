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
  const { player, queue } = state
  const curIdx = queue.result.indexOf[player.queueId]

  return {
    curItem: queue.entities[player.queueId],
    nextItem: queue.entities[curIdx + 1],
    isAtQueueEnd: player.isAtQueueEnd,
    volume: player.volume,
    isPlaying: player.isPlaying,
    isFetching: player.isFetching,
    isErrored: typeof state.room.errors[state.room.queueId] !== 'undefined',
    // this is passed through to trigger a component update (and
    // therefore a status emission) for client -> player commands
    lastTimestamp: player.lastTimestamp,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
