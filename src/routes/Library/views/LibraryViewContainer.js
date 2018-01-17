import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import LibraryView from './LibraryView'
import { queueSong } from 'routes/Queue/modules/queue'
import { toggleSongStarred } from 'store/modules/user'
import { scrollArtists, toggleArtistExpanded, toggleArtistResultExpanded } from '../modules/library'

const getArtists = (state) => state.artists
const getSongs = (state) => state.songs
const getSearchStr = (state) => state.library.searchStr.toLowerCase()
// const getView = (state) => state.library.view
// const getStarredMedia = (state) => state.user.starredSongs

const getResultsWithKeyword = createSelector(
  [getArtists, getSongs, getSearchStr],
  (artists, songs, searchStr) => {
    const artistsResult = artists.result.filter(id =>
      artists.entities[id].name.toLowerCase().includes(searchStr)
    )

    const songsResult = songs.result.filter(id =>
      songs.entities[id].title.toLowerCase().includes(searchStr)
    )

    return { artistsResult, songsResult }
  }
)

const getQueue = (state) => state.queue
const getQueuedSongs = createSelector(
  [getQueue],
  (queue) => queue.result.map(queueId => queue.entities[queueId].songId)
)

const mapStateToProps = (state) => {
  const { artistsResult, songsResult } = getResultsWithKeyword(state)

  return {
    artists: state.artists.entities,
    artistsResult,
    songs: state.songs.entities,
    songsResult,
    queuedSongIds: getQueuedSongs(state),
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
