import PlayerView from '../components/PlayerView'
import { connect } from 'react-redux'
import {ensureState} from 'redux-optimistic-ui'
import { emitStatus, getMedia, getMediaSuccess, mediaError, requestPlayNext } from '../modules/player'

const mapActionCreators = {
  requestPlayNext,
  emitStatus,
  getMedia,
  getMediaSuccess,
  mediaError,
}

const mapStateToProps = (state) => {
  state = ensureState(state)

  let songId
  let queueId = state.player.queueId

  if (state.queue.entities[queueId]) {
    songId = state.queue.entities[queueId].songId
  }

  return {
    queueId: state.player.queueId,
    song: state.library.songs.entities[songId],
    isFinished: state.player.isFinished,
    isPlaying: state.player.isPlaying,
    isFetching: state.player.isFetching,
    isErrored: typeof state.player.errors[queueId] !== 'undefined'
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
