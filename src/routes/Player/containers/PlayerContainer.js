import PlayerView from '../components/PlayerView'
import { connect } from 'react-redux'
import { status, getMedia, getMediaSuccess, mediaError, mediaEnd, requestPlayNext } from '../modules/player'

const mapActionCreators = {
  requestPlayNext,
  status,
  getMedia,
  getMediaSuccess,
  mediaError,
  mediaEnd,
}

const mapStateToProps = (state) => ({
  item: state.queue.entities[state.player.queueId],
  errors: state.queue.errors,
  isPlaying: state.player.isPlaying,
  isFetching: state.player.isFetching,
  libraryHasLoaded: state.library.hasLoaded,
})

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
