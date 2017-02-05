import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import LibraryView from '../components/LibraryView'
import { queueSong } from '../../Queue/modules/queue'
import { scrollArtists, toggleArtistExpanded } from '../modules/library'

const mapActionCreators = {
  queueSong,
  scrollArtists,
  toggleArtistExpanded,
}

const mapStateToProps = (state) => {
  return {
    artists: state.library.artists,
    songs: state.library.songs,
    queuedSongIds: ensureState(state.queue).songIds,
    expandedArtists: state.library.expandedArtists,
    isSearching: state.library.isSearching,
    artistResults: state.library.artistResults,
    songResults: state.library.songResults,
    scrollTop: state.library.scrollTop,
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
