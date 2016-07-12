import PlayerView from '../components/PlayerView'
import { connect } from 'react-redux'
import { status, getMedia, getMediaSuccess, mediaError, mediaEnd } from '../modules/player'
import { requestPlayNext } from '../../Queue/modules/queue'

const mapActionCreators = {
  requestPlayNext,
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
  isFetching: state.player.isFetching,
})

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
