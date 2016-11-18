import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import PlaybackCtrl from './PlaybackCtrl'
import { requestPlay, requestPause, requestVolume, requestPlayNext } from 'routes/Player/modules/player'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  requestPlay,
  requestPlayNext,
  requestPause,
  requestVolume,
}

const mapStateToProps = (state) => {
  state = ensureState(state)

  return {
    queueId: state.player.queueId,
    position: state.player.position,
    volume: state.player.volume,
    isPlaying: state.player.isPlaying,
    isAtQueueEnd: state.player.isAtQueueEnd,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlaybackCtrl)
