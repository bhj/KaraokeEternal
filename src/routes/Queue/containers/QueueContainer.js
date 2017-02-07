import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import QueueView from '../components/QueueView'
import { queueSong, removeItem } from '../modules/queue'
import { requestPlay, requestPause, requestPlayNext } from '../../Player/modules/player'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  queueSong,
  removeItem,
  requestPlay,
  requestPlayNext,
  requestPause,
}

const mapStateToProps = (state) => {
  return {
    queue: ensureState(state.queue),
    errors: state.player.errors,
    curId: state.player.queueId,
    curPos: state.player.position,
    isAtQueueEnd: state.player.isAtQueueEnd,
    artists: state.library.artists,
    songs: state.library.songs,
    // user
    user: state.account.user,
  }
}

export default connect(mapStateToProps, mapActionCreators)(QueueView)
