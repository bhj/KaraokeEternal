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
  let songId, song
  state = ensureState(state)

  if (state.queue.entities[state.player.queueId]) {
    songId = state.queue.entities[state.player.queueId].songId
    song = state.library.songs.entities[songId]
  }

  return {
    queueId: state.player.queueId,
    song,
    isFinished: state.player.isFinished,
    isPlaying: state.player.isPlaying,
    isFetching: state.player.isFetching,
    isErrored: typeof state.player.errors[state.player.queueId] !== 'undefined'
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
