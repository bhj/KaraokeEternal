import { connect } from 'react-redux'
import LibraryView from './LibraryView'
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
    artists: state.library.artists,
    songs: state.library.songs,
    queuedSongs: state.queue.songIds,
    starredSongs: state.user.starredSongs,
    expandedArtists: state.library.expandedArtists,
    scrollTop: state.library.scrollTop,
    // search
    searchTerm: state.library.searchTerm,
    artistResults: state.library.artistSearchResult,
    songResults: state.library.songSearchResult,
    expandedArtistResults: state.library.expandedArtistResults,
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
