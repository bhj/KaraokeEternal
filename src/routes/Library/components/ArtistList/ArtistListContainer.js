import { connect } from 'react-redux'
import { queueSong } from '../../../Queue/modules/queue'
import { toggleSongStarred } from 'store/modules/user'
import { scrollArtists, toggleArtistExpanded } from '../../modules/library'
import ArtistList from './ArtistList'

const mapActionCreators = {
  queueSong,
  toggleSongStarred,
  scrollArtists,
  toggleArtistExpanded,
}

const mapStateToProps = (state) => {
  return {
    artists: state.library.artists,
    songs: state.library.songs,
    queuedSongIds: state.queue.songIds,
    starredSongs: state.user.starredSongs,
    expandedArtists: state.library.expandedArtists,
    scrollTop: state.library.scrollTop,
  }
}

export default connect(mapStateToProps, mapActionCreators)(ArtistList)
