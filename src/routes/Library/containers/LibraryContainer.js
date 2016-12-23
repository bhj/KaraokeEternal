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
    queuedSongs: ensureState(state.queue).songIds,
    expandedArtists: state.library.expandedArtists,
    scrollTop: state.library.scrollTop,
    width: state.browser.width,
    height: state.browser.height,
  }
}

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
