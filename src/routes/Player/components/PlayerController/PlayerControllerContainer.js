import PlayerController from './PlayerController'
import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import { requestPlayNext } from 'store/modules/status'
import {
  emitStatus,
  emitError,
  emitLeave,
  cancelStatus,
  mediaRequest,
  mediaRequestSuccess,
  mediaRequestError,
} from '../../modules/player'

const mapActionCreators = {
  emitStatus,
  emitError,
  emitLeave,
  cancelStatus,
  requestPlayNext,
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
  const { player, status } = state
  const queue = ensureState(state.queue)

  return {
    queueItem: queue.entities[player.queueId] || defaultQueueItem,
    volume: player.volume,
    isAtQueueEnd: player.isAtQueueEnd,
    isQueueEmpty: queue.result.length === 0,
    isPlaying: player.isPlaying,
    isFetching: player.isFetching,
    isErrored: typeof status.errors[status.queueId] !== 'undefined',
    // timestamp pass-through triggers status emission for each received command
    lastCommandAt: player.lastCommandAt,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerController)
