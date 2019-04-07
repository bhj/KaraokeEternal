import PlayerController from './PlayerController'
import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import getOrderedQueue from 'routes/Queue/selectors/getOrderedQueue'
import {
  emitStatus,
  playerError,
  emitLeave,
  cancelStatus,
  loadQueueItem,
  mediaElementChange,
  mediaRequest,
  mediaRequestSuccess,
  mediaRequestError,
  queueEnd,
} from '../../modules/player'

const mapActionCreators = {
  emitStatus,
  playerError,
  emitLeave,
  cancelStatus,
  loadQueueItem,
  mediaElementChange,
  mediaRequest,
  mediaRequestSuccess,
  mediaRequestError,
  queueEnd,
}

const mapStateToProps = (state) => {
  const { player, playerVisualizer } = state
  const queue = ensureState(state.queue)

  return {
    bgAlpha: player.bgAlpha,
    isAtQueueEnd: player.isAtQueueEnd,
    isQueueEmpty: queue.result.length === 0,
    isPlaying: player.isPlaying,
    isPlayingNext: player.isPlayingNext,
    isFetching: player.isFetching,
    isErrored: player.isErrored,
    queue: getOrderedQueue(queue),
    queueId: player.queueId,
    volume: player.volume,
    visualizer: playerVisualizer,
    // timestamp pass-through triggers status emission for each received command
    lastCommandAt: player.lastCommandAt,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerController)
