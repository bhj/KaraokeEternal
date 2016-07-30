import { connect } from 'react-redux'
import QueueView from '../components/QueueView'
import { queueSong, removeItem, requestPlay, requestPause } from '../modules/queue'
import { requestPlayNext } from '../../Player/modules/player'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  queueSong,
  removeItem,
  requestPlay,
  requestPlayNext,
  requestPause,
}

const mapStateToProps = (state) => ({
  result: state.queue.result,
  entities: state.queue.entities,
  errors: state.queue.errors,
  curId: state.queue.curId,
  curPos: state.queue.curPos,
  isPlaying: state.queue.isPlaying,
  // library
  artistIds: state.library.artists.result,
  artists: state.library.artists.entities,
  songIds: state.library.songs.result,
  songs: state.library.songs.entities,
  // user
  user: state.account.user,
})

export default connect(mapStateToProps, mapActionCreators)(QueueView)
