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
  let songId
  state = ensureState(state)

  if (state.queue.curId) {
    songId = state.queue.entities[state.queue.curId].songId
  }

  return {
    queueId: state.queue.curId,
    song: state.library.songs.entities[songId],
    isFinished: state.queue.isFinished,
    isPlaying: state.player.isPlaying,
    isFetching: state.player.isFetching,
    isErrored: typeof state.queue.errors[state.queue.curId] !== 'undefined'
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
