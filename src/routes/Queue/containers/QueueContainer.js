import { connect } from 'react-redux'
import { fetchQueue, queueSong, deleteItem } from '../modules/queue'
import QueueView from '../components/QueueView'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  fetchQueue,
  queueSong,
  deleteItem
}

const mapStateToProps = (state) => ({
  queuedIds: state.queue.result,
  queuedItems: state.queue.entities,
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
