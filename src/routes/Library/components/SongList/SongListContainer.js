import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import SongList from './SongList'
import { queueSong } from 'routes/Queue/modules/queue'
import { toggleSongStarred } from 'store/modules/user'
import { showSongInfo } from '../../modules/library'

const getQueue = (state) => state.queue

const getQueuedSongs = createSelector(
  [getQueue],
  (queue) => queue.result.map(queueId => queue.entities[queueId].songId)
)

const mapStateToProps = (state, props) => ({
  artists: state.artists.entities,
  songs: state.songs.entities,
  queuedSongIds: getQueuedSongs(state),
  starredSongs: state.user.starredSongs,
  isAdmin: state.user.isAdmin,
})

const mapActionCreators = {
  queueSong,
  toggleSongStarred,
  showSongInfo,
}

export default connect(mapStateToProps, mapActionCreators)(SongList)
