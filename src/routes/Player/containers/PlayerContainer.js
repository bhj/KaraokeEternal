import { connect } from 'react-redux'
import { play, pause, getMedia, getMediaSuccess, getMediaError } from '../modules/player'
import PlayerView from '../components/PlayerView'

const mapActionCreators = {
  play,
  pause,
  getMedia,
  getMediaSuccess,
  getMediaError,
}

const mapStateToProps = (state) => ({
  queue: state.queue,
  isPlaying: state.player.isPlaying,
  isFetching: state.player.isFetching,
})

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
