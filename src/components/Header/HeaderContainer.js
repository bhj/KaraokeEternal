import { connect } from 'react-redux'
import {ensureState} from 'redux-optimistic-ui'
import Header from './Header'
import { requestPlay, requestPause } from 'routes/Queue/modules/queue'
import { requestPlayNext } from 'routes/Player/modules/player'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  requestPlay,
  requestPlayNext,
  requestPause,
}

const mapStateToProps = (state) => {
  state = ensureState(state)

  return {
    curId: state.queue.curId,
    curPos: state.queue.curPos,
    isPlaying: state.queue.isPlaying,
    isFinished: state.queue.isFinished,
    // library
    artistIds: state.library.artists.result,
    artists: state.library.artists.entities,
    songIds: state.library.songs.result,
    songs: state.library.songs.entities,
    // user
    user: state.account.user,
  }
}

export default connect(mapStateToProps, mapActionCreators)(Header)
