import { connect } from 'react-redux'
import PlaybackCtrl from './PlaybackCtrl'
import {
  requestBackgroundAlpha,
  requestPause,
  requestPlay,
  requestPlayNext,
  requestVisualizer,
  requestVisualizerPreset,
  requestVolume,
} from 'store/modules/status'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  requestBackgroundAlpha,
  requestPause,
  requestPlay,
  requestPlayNext,
  requestVisualizer,
  requestVisualizerPreset,
  requestVolume,
}

const mapStateToProps = (state) => {
  return {
    isAdmin: state.user.isAdmin,
    isInRoom: state.user.roomId !== null,
    isPlayer: state.location.pathname === '/player',
    status: state.status,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlaybackCtrl)
