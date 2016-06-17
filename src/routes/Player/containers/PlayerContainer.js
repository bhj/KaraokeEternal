import { connect } from 'react-redux'
import { play, pause } from '../modules/player'
import { fetchQueue } from '../Queue/modules/queue'
import PlayerView from '../components/PlayerView'

const mapActionCreators = {
  play,
  pause,
  fetchQueue
}

const mapStateToProps = (state) => ({
  queue: state.queue,
  isPlaying: state.player.isPlaying,
  isFetching: state.player.isFetching,
})

export default connect(mapStateToProps, mapActionCreators)(PlayerView)
