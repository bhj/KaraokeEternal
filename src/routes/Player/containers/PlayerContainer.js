import PlayerView from '../components/PlayerView'
import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import { emitStatus, emitError, getMedia, getMediaSuccess, requestPlayNext } from '../modules/player'

const mapActionCreators = {
  requestPlayNext,
  emitStatus,
  getMedia,
  getMediaSuccess,
  emitError,
}

const mapStateToProps = (state) => {
  let queue = ensureState(state.queue)
  let songId, song

  if (queue.entities[state.player.queueId]) {
    songId = queue.entities[state.player.queueId].songId
    song = state.library.songs.entities[songId]
  }

  return {
    song,
    queue: ensureState(state.queue),
    queueId: state.player.queueId,
    volume: state.player.volume,
    isAtQueueEnd: state.player.isAtQueueEnd,
    isPlaying: state.player.isPlaying,
    isFetching: state.player.isFetching,
    isErrored: typeof state.status.errors[state.status.queueId] !== 'undefined',
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
