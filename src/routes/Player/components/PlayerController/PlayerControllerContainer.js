import PlayerController from './PlayerController'
import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import getOrderedQueue from 'routes/Queue/selectors/getOrderedQueue'
import {
  emitLeave,
  emitStatus,
  playerError,
  playerLoad,
  playerPlay,
  playerStatus,
} from '../../modules/player'
import { playerVisualizerError } from '../../modules/playerVisualizer'

const mapActionCreators = {
  emitLeave,
  emitStatus,
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
    historyJSON: state.status.historyJSON,
    isAlphaSupported: player.isAlphaSupported,
    isAtQueueEnd: player.isAtQueueEnd,
    isFetching: player.isFetching,
    isQueueEmpty: queue.result.length === 0,
    isPlaying: player.isPlaying,
    isPlayingNext: player.isPlayingNext,
    isReplayGainEnabled: prefs.isReplayGainEnabled,
    isErrored: player.isErrored,
    queue: getOrderedQueue(state),
    queueId: player.queueId,
    rgTrackGain: player.rgTrackGain,
    rgTrackPeak: player.rgTrackPeak,
    volume: player.volume,
    visualizer: playerVisualizer,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerController)
