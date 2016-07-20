import { connect } from 'react-redux'
import { queueSong, removeItem, requestPlay, requestPlayNext, requestPause } from '../modules/queue'
import QueueView from '../components/QueueView'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  queueSong,
  removeItem,
  requestPlay,
  requestPlayNext,
  requestPause,
}

const mapStateToProps = (state) => ({
  queueIds: state.queue.result.queueIds,
  uids: state.queue.result.uids,
  items: state.queue.entities,
  errorMessage: state.queue.errorMessage,
  errors: state.queue.errors,
  // library
  artistIds: state.library.artists.result,
  artists: state.library.artists.entities,
  songUIDs: state.library.songs.result,
  songs: state.library.songs.entities,
  // user
  user: state.account.user,
  // player
  isPlaying: state.queue.isPlaying,
  currentId: state.queue.currentId,
  currentTime: state.queue.currentTime,
  duration: state.queue.duration,
})

export default connect(mapStateToProps, mapActionCreators)(QueueView)
