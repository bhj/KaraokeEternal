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
    isPlaying: state.status.isPlaying,
    volume: state.status.volume,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlaybackCtrl)
