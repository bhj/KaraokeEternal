import { connect } from 'react-redux'
import {ensureState} from 'redux-optimistic-ui'
import QueueView from '../components/QueueView'
import { queueSong, removeItem } from '../modules/queue'
import { requestPlay, requestPause, requestPlayNext } from '../../Player/modules/player'

//  Object of action creators (can also be function that returns object).
const mapActionCreators = {
  queueSong,
  removeItem,
  requestPlay,
  requestPlayNext,
  requestPause,
}

const mapStateToProps = (state) => {
  state = ensureState(state)

  return {
    result: state.queue.result,
    entities: state.queue.entities,
    errors: state.player.errors,
    curId: state.player.queueId,
    curPos: state.player.position,
    isAtQueueEnd: state.player.isAtQueueEnd,
    // library
    artistIds: state.library.artists.result,
    artists: state.library.artists.entities,
    songIds: state.library.songs.result,
    songs: state.library.songs.entities,
    // user
    user: state.account.user,
  }
}

export default connect(mapStateToProps, mapActionCreators)(QueueView)
