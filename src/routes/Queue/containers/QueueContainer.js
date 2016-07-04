import { connect } from 'react-redux'
import { queueSong, playNext, removeItem } from '../modules/queue'
import QueueView from '../components/QueueView'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  queueSong,
  removeItem,
  playNext,
}

const mapStateToProps = (state) => ({
  queueIds: state.queue.result.queueIds,
  uids: state.queue.result.uids,
  items: state.queue.entities,
  playingId: state.queue.playingId,
  errorMessage: state.queue.errorMessage,
  // library data
  artistIds: state.library.artists.result,
  artists: state.library.artists.entities,
  songUIDs: state.library.songs.result,
  songs: state.library.songs.entities,
  // user data
  user: state.account.user,
})

export default connect(mapStateToProps, mapActionCreators)(QueueView)
