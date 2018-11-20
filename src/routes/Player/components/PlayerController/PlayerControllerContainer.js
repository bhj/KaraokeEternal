import PlayerController from './PlayerController'
import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import { requestPlayNext } from 'store/modules/status'
import {
  emitStatus,
  playerError,
  emitLeave,
  cancelStatus,
  mediaChange,
  mediaRequest,
  mediaRequestSuccess,
  mediaRequestError,
} from '../../modules/player'

const mapActionCreators = {
  emitStatus,
  playerError,
  emitLeave,
  cancelStatus,
  requestPlayNext,
  mediaChange,
  mediaRequest,
  mediaRequestSuccess,
  mediaRequestError,
}

// simplify player logic; if this reference changes on each
// render it will cause an infinite loop of status updates
const defaultQueueItem = {
  queueId: -1,
}

const mapStateToProps = (state) => {
  const { player, playerVisualizer } = state
  const queue = ensureState(state.queue)

  return {
    bgAlpha: player.bgAlpha,
    queueItem: queue.entities[player.queueId] || defaultQueueItem,
    volume: player.volume,
    isAtQueueEnd: player.isAtQueueEnd,
    isQueueEmpty: queue.result.length === 0,
    isPlaying: player.isPlaying,
    isFetching: player.isFetching,
    isErrored: player.isErrored,
    visualizer: playerVisualizer,
    // timestamp pass-through triggers status emission for each received command
    lastCommandAt: player.lastCommandAt,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerController)
