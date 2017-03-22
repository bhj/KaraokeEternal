import { connect } from 'react-redux'
import LibraryView from '../components/LibraryView'
import { queueSong } from '../../Queue/modules/queue'
import { toggleSongStarred } from 'store/modules/user'
import { scrollArtists, toggleArtistExpanded, toggleArtistResultExpanded } from '../modules/library'

const mapActionCreators = {
  queueSong,
  toggleSongStarred,
  toggleArtistExpanded,
  toggleArtistResultExpanded,
  scrollArtists,
}

const mapStateToProps = (state) => {
  return {
    artists: state.artists,
    songs: state.songs,
    queuedSongs: state.queue.songIds,
    starredSongs: state.user.starredSongs,
    expandedArtists: state.library.expandedArtists,
    scrollTop: state.library.scrollTop,
    // search
    searchTerm: state.library.searchTerm,
    artistResults: state.library.artistResults,
    expandedArtistResults: state.library.expandedArtistResults,
    songResults: state.library.songResults,
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
