import PlayerController from './PlayerController'
import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import getOrderedQueue from 'routes/Queue/selectors/getOrderedQueue'
import {
  playerLeave,
  playerError,
  playerLoad,
  playerPlay,
  playerStatus,
} from '../../modules/player'
import { playerVisualizerError } from '../../modules/playerVisualizer'

const mapActionCreators = {
  playerLeave,
  playerError,
  playerLoad,
  playerPlay,
  playerStatus,
  playerVisualizerError,
}

const mapStateToProps = (state) => {
  const { player, playerVisualizer, prefs } = state
  const queue = ensureState(state.queue)

  return {
    cdgAlpha: player.cdgAlpha,
    cdgSize: player.cdgSize,
    historyJSON: state.status.historyJSON, // @TODO use state.player instead?
    isAtQueueEnd: player.isAtQueueEnd,
    isErrored: player.isErrored,
    isPlaying: player.isPlaying,
    isPlayingNext: player.isPlayingNext,
    isQueueEmpty: queue.result.length === 0,
    isReplayGainEnabled: prefs.isReplayGainEnabled,
    isWebGLEnabled: player.isWebGLEnabled,
    mp4Alpha: player.mp4Alpha,
    queue: getOrderedQueue(state),
    queueId: player.queueId,
    volume: player.volume,
    visualizer: playerVisualizer,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerController)
