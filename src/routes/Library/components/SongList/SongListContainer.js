import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import SongList from './SongList'
import { queueSong } from 'routes/Queue/modules/queue'
import { starSong, unstarSong } from 'store/modules/user'
import { showSongInfo } from '../../modules/library'

const mapStateToProps = (state, props) => ({
  artists: state.artists.entities,
  songs: state.songs.entities,
  starredSongs: ensureState(state.user.starredSongs),
  isAdmin: state.user.isAdmin,
})

const mapActionCreators = {
  queueSong,
  starSong,
  unstarSong,
  showSongInfo,
}

export default connect(mapStateToProps, mapActionCreators)(SongList)
