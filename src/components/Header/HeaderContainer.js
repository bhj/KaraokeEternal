import { connect } from 'react-redux'
import {ensureState} from 'redux-optimistic-ui'
import Header from './Header'
import { requestPlay, requestPause } from 'routes/Queue/modules/queue'
import { requestPlayNext } from 'routes/Player/modules/player'
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
    curId: state.queue.curId,
    curPos: state.queue.curPos,
    isPlaying: state.queue.isPlaying,
    isFinished: state.queue.isFinished,
    errorMessage: state.errorMessage,
  }
}

export default connect(mapStateToProps, mapActionCreators)(Header)
