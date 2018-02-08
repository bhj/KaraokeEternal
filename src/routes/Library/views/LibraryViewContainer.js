import { connect } from 'react-redux'
import { createSelector } from 'reselect'
import LibraryView from './LibraryView'
import { queueSong } from 'routes/Queue/modules/queue'
import { toggleSongStarred } from 'store/modules/user'
import {
  scrollArtists,
  toggleArtistExpanded,
  toggleArtistResultExpanded,
  showSongInfo,
} from '../modules/library'

const getArtists = (state) => state.artists
const getSongs = (state) => state.songs
const getFilterStr = (state) => state.library.filterStr.trim().toLowerCase()
const getFilterStarred = (state) => state.library.filterStarred
const getStarredArtists = (state) => state.user.starredArtists
const getStarredSongs = (state) => state.user.starredSongs
const getQueue = (state) => state.queue

const getQueuedSongs = createSelector(
  [getQueue],
  (queue) => queue.result.map(queueId => queue.entities[queueId].songId)
)

const getFilterKeywords = createSelector(
  [getFilterStr],
  (str) => str.split(' ')
)

// library filters
// ---------------------

// #1: keyword filters
const getArtistsWithKeyword = createSelector(
  [getArtists, getFilterStr, getFilterKeywords],
  (artists, str, keywords) => {
    if (!str) return artists.result
    return artists.result.filter(id => keywords.every(word => artists.entities[id].name.toLowerCase().includes(word)))
  })

const getSongsWithKeyword = createSelector(
  [getSongs, getFilterStr, getFilterKeywords],
  (songs, str, keywords) => {
    if (!str) return songs.result
    return songs.result.filter(id => keywords.every(word => songs.entities[id].title.toLowerCase().includes(word)))
  })

// #2: starred/hidden filters
const getArtistsByView = createSelector(
  [getArtistsWithKeyword, getFilterStarred, getStarredArtists],
  (artistsWithKeyword, filterStarred, starredArtists) =>
    artistsWithKeyword.filter(artistId => {
      return filterStarred ? starredArtists.includes(artistId) : true
    })
)

const getSongsByView = createSelector(
  [getSongsWithKeyword, getFilterStarred, getStarredSongs],
  (songsWithKeyword, filterStarred, starredSongs) =>
    songsWithKeyword.filter(songId => {
      return filterStarred ? starredSongs.includes(songId) : true
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
    isShowingSongInfo: !(state.library.songInfoSongId === null),
    // filters
    isFiltering: state.library.filterStr !== '' || state.library.filterStarred,
    filterKeywords: getFilterKeywords(state),
    expandedArtistResults: state.library.expandedArtistResults,
  }
}

const mapActionCreators = {
  queueSong,
  toggleSongStarred,
  toggleArtistExpanded,
  toggleArtistResultExpanded,
  scrollArtists,
  showSongInfo,
}

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
