import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import LibraryView from './LibraryView'
import { queueSong } from 'routes/Queue/modules/queue'
import { toggleSongStarred } from 'store/modules/user'
import { scrollArtists, toggleArtistExpanded, toggleArtistResultExpanded } from '../modules/library'

const getArtists = (state) => state.artists
const getMedia = (state) => state.media
const getSearchStr = (state) => state.library.searchStr.toLowerCase()
// const getView = (state) => state.library.view
// const getStarredMedia = (state) => state.user.starredSongs

const getResultsWithKeyword = createSelector(
  [getArtists, getMedia, getSearchStr],
  (artists, media, searchStr) => {
    const artistsResult = artists.result.filter(id =>
      artists.entities[id].name.toLowerCase().includes(searchStr)
    )

    const mediaResult = media.result.filter(id =>
      media.entities[id].title.toLowerCase().includes(searchStr)
    )

    return { artistsResult, mediaResult }
  }
)

const getQueue = (state) => state.queue
const getQueuedMediaIds = createSelector(
  [getQueue],
  (queue) => queue.result.map(queueId => queue.entities[queueId].mediaId)
)

const mapStateToProps = (state) => {
  const { artistsResult, mediaResult } = getResultsWithKeyword(state)

  return {
    artists: state.artists,
    artistsResult,
    media: state.media,
    mediaResult,
    queuedMediaIds: getQueuedMediaIds(state),
    starredSongs: state.user.starredSongs,
    expandedArtists: state.library.expandedArtists,
    scrollTop: state.library.scrollTop,
    // search view
    searchStr: state.library.searchStr,
    expandedArtistResults: state.library.expandedArtistResults,
  }
}

const mapActionCreators = {
  queueSong,
  toggleSongStarred,
  toggleArtistExpanded,
  toggleArtistResultExpanded,
  scrollArtists,
}

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
