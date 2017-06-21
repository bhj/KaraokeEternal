import { connect } from 'react-redux'
import PlaybackCtrl from './PlaybackCtrl'
import { requestPlay, requestPause, requestVolume, requestPlayNext } from 'store/modules/status'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  requestPlay,
  requestPlayNext,
  requestPause,
  requestVolume,
}

const mapStateToProps = (state) => {
  return {
    isAdmin: state.user.isAdmin,
    isInRoom: state.user.roomId !== null,
    isPlaying: state.status.isPlaying,
    isAtQueueEnd: state.status.isAtQueueEnd,
    volume: state.status.volume,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlaybackCtrl)
