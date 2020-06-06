import { connect } from 'react-redux'
import PlaybackCtrl from './PlaybackCtrl'
import {
  requestOptions,
  requestPause,
  requestPlay,
  requestPlayNext,
  requestVolume,
} from 'store/modules/status'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  requestOptions,
  requestPause,
  requestPlay,
  requestPlayNext,
  requestVolume,
}

const mapStateToProps = (state) => {
  return {
    isAdmin: state.user.isAdmin,
    isInRoom: state.user.roomId !== null,
    isPlayer: state.location.pathname.startsWith('/player'),
    status: state.status,
    ui: state.ui,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlaybackCtrl)
