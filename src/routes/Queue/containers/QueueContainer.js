import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import QueueView from '../components/QueueView'
import { showErrorMessage } from 'store/modules/ui'
import { queueSong, removeItem } from '../modules/queue'
import { requestPlay, requestPause, requestPlayNext } from '../../Player/modules/player'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  queueSong,
  removeItem,
  requestPlay,
  requestPlayNext,
  requestPause,
  showErrorMessage,
}

const mapStateToProps = (state) => {
  return {
    queue: ensureState(state.queue),
    errors: state.status.errors,
    curId: state.status.queueId,
    curPos: state.status.position,
    isAtQueueEnd: state.status.isAtQueueEnd,
    artists: state.library.artists,
    songs: state.library.songs,
    // user
    user: state.user.user,
  }
}

export default connect(mapStateToProps, mapActionCreators)(QueueView)
