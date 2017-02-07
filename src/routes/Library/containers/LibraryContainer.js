import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import LibraryView from '../components/LibraryView'
import { queueSong } from '../../Queue/modules/queue'
import { scrollArtists, toggleArtistExpanded, toggleArtistResultExpanded } from '../modules/library'

const mapActionCreators = {
  queueSong,
  scrollArtists,
  toggleArtistExpanded,
  toggleArtistResultExpanded,
}

const mapStateToProps = (state) => {
  return {
    artists: state.library.artists,
    songs: state.library.songs,
    queuedSongIds: ensureState(state.queue).songIds,
    expandedArtists: state.library.expandedArtists,
    scrollTop: state.library.scrollTop,
    // search view
    searchTerm: state.library.searchTerm,
    artistResults: state.library.artistResults,
    expandedArtistResults: state.library.expandedArtistResults,
    songResults: state.library.songResults,
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
