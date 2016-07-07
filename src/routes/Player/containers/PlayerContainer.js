import PlayerView from '../components/PlayerView'
import { connect } from 'react-redux'
import { requestPlay, requestPlayNext, requestPause, status, getMedia, getMediaSuccess, mediaError, mediaEnd } from '../modules/player'

const mapActionCreators = {
  requestPlay,
  requestPlayNext,
  requestPause,
  status,
  getMedia,
  getMediaSuccess,
  mediaError,
  mediaEnd,
}

const mapStateToProps = (state) => ({
  queue: state.queue,
  libraryHasLoaded: state.library.hasLoaded,
  currentId: state.player.currentId,
  isPlaying: state.player.isPlaying,
  currentTime: state.player.currentTime,
  isFetching: state.player.isFetching,
})

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
