import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import LibraryView from './LibraryView'
import { queueSong } from 'routes/Queue/modules/queue'
import { toggleSongStarred } from 'store/modules/user'
import { scrollArtists, toggleArtistExpanded, toggleArtistResultExpanded } from '../modules/library'

const getArtists = (state) => state.artists
const getSongs = (state) => state.songs
const getFilterStr = (state) => state.library.filterString.toLowerCase()
const getFilterStatus = (state) => state.library.filterStatus
const getStarredArtists = (state) => state.user.starredArtists
const getStarredSongs = (state) => state.user.starredSongs
const getQueue = (state) => state.queue

const getQueuedSongs = createSelector(
  [getQueue],
  (queue) => queue.result.map(queueId => queue.entities[queueId].songId)
)

// library filters
// ---------------------

// #1: keyword filter
const getArtistsWithKeyword = createSelector(
  [getArtists, getFilterStr],
  (artists, filterString) =>
    artists.result.filter(id => artists.entities[id].name.toLowerCase().includes(filterString))
)

const getSongsWithKeyword = createSelector(
  [getSongs, getFilterStr],
  (songs, filterString) =>
    songs.result.filter(id => songs.entities[id].title.toLowerCase().includes(filterString))
)

// #2: starred/hidden status filter
const getArtistsByView = createSelector(
  [getArtistsWithKeyword, getFilterStatus, getStarredArtists],
  (artistsWithKeyword, filterStatus, starredArtists) =>
    artistsWithKeyword.filter(artistId => {
      if (filterStatus === '') return true
      else if (filterStatus === 'starred') return starredArtists.includes(artistId)
    })
)

const getSongsByView = createSelector(
  [getSongsWithKeyword, getFilterStatus, getStarredSongs],
  (songsWithKeyword, filterStatus, starredSongs) =>
    songsWithKeyword.filter(songId => {
      if (filterStatus === '') return true
      else if (filterStatus === 'starred') return starredSongs.includes(songId)
    })
)

const mapStateToProps = (state) => {
  return {
    artists: state.artists.entities,
    artistsResult: getArtistsByView(state),
    songs: state.songs.entities,
    songsResult: getSongsByView(state),
    queuedSongIds: getQueuedSongs(state),
    starredSongs: state.user.starredSongs,
    expandedArtists: state.library.expandedArtists,
    scrollTop: state.library.scrollTop,
    // filters
    isFiltering: state.library.filterString || state.library.filterStatus,
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
