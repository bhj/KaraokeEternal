import { connect } from 'react-redux'
import {ensureState} from 'redux-optimistic-ui'
import Header from './Header'
import { requestPlay, requestPause, requestPlayNext } from 'routes/Player/modules/player'
import { clearErrorMessage } from 'store/reducers'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  requestPlay,
  requestPlayNext,
  requestPause,
  clearErrorMessage,
}

const mapStateToProps = (state) => {
  state = ensureState(state)

  return {
    queueId: state.player.queueId,
    pos: state.player.pos,
    isPlaying: state.player.isPlaying,
    isAtQueueEnd: state.player.isAtQueueEnd,
    errorMessage: state.errorMessage,
  }
}

export default connect(mapStateToProps, mapActionCreators)(Header)
