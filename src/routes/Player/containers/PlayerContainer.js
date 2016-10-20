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

  return {
    curId: state.queue.curId,
    isFinished: state.queue.isFinished,
    item: state.queue.entities[state.queue.curId],
    errors: state.queue.errors,
    isPlaying: state.player.isPlaying,
    isFetching: state.player.isFetching,
  }
}

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
