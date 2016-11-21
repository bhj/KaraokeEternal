import PlayerView from '../components/PlayerView'
import { connect } from 'react-redux'
import {ensureState} from 'redux-optimistic-ui'
import { emitStatus, cancelStatus, getMedia, getMediaSuccess, mediaError, requestPlayNext } from '../modules/player'

const mapActionCreators = {
  requestPlayNext,
  emitStatus,
  getMedia,
  getMediaSuccess,
  mediaError,
  cancelStatus,
}

const mapStateToProps = (state) => {
  let songId, song
  state = ensureState(state)

  if (state.queue.entities[state.player.queueId]) {
    songId = state.queue.entities[state.player.queueId].songId
    song = state.library.songs.entities[songId]
  }

  return {
    queueId: state.player.queueId,
    volume: state.player.volume,
    song,
    isAtQueueEnd: state.player.isAtQueueEnd,
    isPlaying: state.player.isPlaying,
    isFetching: state.player.isFetching,
    isErrored: typeof state.player.errors[state.player.queueId] !== 'undefined',
    width: state.browser.width,
    height: state.browser.height,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
