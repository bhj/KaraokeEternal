import { connect } from 'react-redux'
import QueueView from './QueueView'
import { showErrorMessage } from 'store/modules/ui'
import { requestPlay, requestPause, requestPlayNext } from 'store/modules/status'
import { queueSong, removeItem } from '../modules/queue'

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
    queue: state.queue,
    errors: state.status.errors,
    curId: state.status.queueId,
    curPos: state.status.position,
    isAtQueueEnd: state.status.isAtQueueEnd,
    artists: state.library.artists,
    songs: state.library.songs,
    // user
    user: state.user,
  }
}

export default connect(mapStateToProps, mapActionCreators)(QueueView)
