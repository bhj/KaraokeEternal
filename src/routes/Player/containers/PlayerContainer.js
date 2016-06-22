import { connect } from 'react-redux'
import { play, pause, changeQueueItem, getMedia, getMediaSuccess, getMediaError } from '../modules/player'
import { fetchQueue } from '../../Queue/modules/queue'
import PlayerView from '../components/PlayerView'

const mapActionCreators = {
  // player
  play,
  pause,
  changeQueueItem,
  getMedia,
  getMediaSuccess,
  getMediaError,
  // queue
  fetchQueue
}

const mapStateToProps = (state) => ({
  queue: state.queue,
  isPlaying: state.player.isPlaying,
  isFetching: state.player.isFetching,
})

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
