import { connect } from 'react-redux'
import LibraryView from './LibraryView'
import { queueSong } from 'routes/Queue/modules/queue'
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
  const queuedMediaIds = state.queue.result.map(queueId =>
    state.queue.entities[queueId].mediaId
  )

  return {
    artists: state.library.artists,
    media: state.library.media,
    queuedMediaIds,
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
