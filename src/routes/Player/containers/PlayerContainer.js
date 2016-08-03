import PlayerView from '../components/PlayerView'
import { connect } from 'react-redux'
import { emitStatus, getMedia, getMediaSuccess, mediaError, requestPlayNext } from '../modules/player'

const mapActionCreators = {
  requestPlayNext,
  emitStatus,
  getMedia,
  getMediaSuccess,
  mediaError,
}

const mapStateToProps = (state) => ({
  curId: state.queue.curId,
  isFinished: state.queue.isFinished,
  item: state.queue.entities[state.queue.curId],
  errors: state.queue.errors,
  isPlaying: state.player.isPlaying,
  isFetching: state.player.isFetching,
  libraryHasLoaded: state.library.hasLoaded,
})

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
