import { connect } from 'react-redux'
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
  return {
    queueId: state.status.queueId,
    position: state.status.position,
    volume: state.status.volume,
    isPlaying: state.status.isPlaying,
    isAtQueueEnd: state.status.isAtQueueEnd,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlaybackCtrl)
