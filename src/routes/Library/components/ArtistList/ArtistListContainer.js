import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import { queueSong } from '../../../Queue/modules/queue'
import { scrollArtists, toggleArtistExpanded } from '../../modules/library'
import ArtistList from './ArtistList'

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
    scrollTop: state.library.scrollTop,
  }
}

export default connect(mapStateToProps, mapActionCreators)(ArtistList)
