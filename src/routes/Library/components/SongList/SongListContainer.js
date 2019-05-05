import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import SongList from './SongList'
import { queueSong } from 'routes/Queue/modules/queue'
import { toggleSongStarred } from 'store/modules/userStars'
import { showSongInfo } from 'store/modules/songInfo'

const mapStateToProps = (state, props) => ({
  artists: state.artists.entities,
  isAdmin: state.user.isAdmin,
  songs: state.songs.entities,
  starredSongs: ensureState(state.userStars).starredSongs,
  starredSongCounts: state.starCounts.songs,
})

const mapActionCreators = {
  queueSong,
  showSongInfo,
  toggleSongStarred,
}

export default connect(mapStateToProps, mapActionCreators)(SongList)
