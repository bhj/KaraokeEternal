import { connect } from 'react-redux'
import { queueSong } from '../../../Queue/modules/queue'
import { scrollArtists, toggleArtistResultExpanded } from '../../modules/library'
import SearchResults from './SearchResults'

const mapActionCreators = {
  queueSong,
  toggleArtistResultExpanded,
}

const mapStateToProps = (state) => {
  return {
    artists: state.library.artists,
    songs: state.library.songs,
    queuedSongIds: state.queue.songIds,
    searchTerm: state.library.searchTerm,
    artistResults: state.library.artistResults,
    expandedArtistResults: state.library.expandedArtistResults,
    songResults: state.library.songResults,
  }
}

export default connect(mapStateToProps, mapActionCreators)(SearchResults)
