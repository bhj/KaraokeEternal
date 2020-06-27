import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from 'reselect'
import { Searcher } from 'fast-fuzzy'
import LibraryView from './LibraryView'
import { scrollArtists, toggleArtistExpanded, toggleArtistResultExpanded } from '../modules/library'
import { showSongInfo, closeSongInfo } from 'store/modules/songInfo'

const getArtists = (state) => state.artists
const getSongs = (state) => state.songs
const getFilterStr = (state) => state.library.filterStr.trim().toLowerCase()
const getFilterStarred = (state) => state.library.filterStarred
const getStarredArtists = (state) => ensureState(state.userStars).starredArtists
const getStarredSongs = (state) => ensureState(state.userStars).starredSongs
const getQueue = (state) => ensureState(state.queue)
const getCurrentQueueId = (state) => state.status.queueId
const getPlayerHistoryJSON = (state) => state.status.historyJSON

const getUpcomingSongs = createSelector(
  [getQueue, getCurrentQueueId, getPlayerHistoryJSON],
  (queue, curId, history) => {
    history = JSON.parse(history)

    // not (re)ordering since it doesn't currently matter in library view
    return queue.result
      .filter(queueId => !history.includes(queueId))
      .map(queueId => queue.entities[queueId].songId)
  }
)

const getFilterKeywords = createSelector(
  [getFilterStr],
  (str) => str.length ? str.split(' ') : []
)

const getAlphaPickerMap = createSelector(
  [getArtists],
  (artists) => {
    const map = { '#': 0 } // letters to row numbers
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    let c = 0

    artists.result.forEach((artistId, i) => {
      const char = artists.entities[artistId].name[0].toUpperCase()
      const distance = chars.indexOf(char) - c

      if (distance >= 0) {
        c += distance
        map[chars[c]] = i
        c++
      }
    })

    return map
  })

// library filters
// ---------------------

const getArtistSearcher = createSelector(
  [getArtists],
  (artists) => new Searcher(artists.result, {
    keySelector: artistId => artists.entities[artistId].name,
    threshold: 0.8,
  })
)

const getSongSearcher = createSelector(
  [getSongs],
  (songs) => new Searcher(songs.result, {
    keySelector: songId => songs.entities[songId].title,
    threshold: 0.8,
  })
)

// #1: keyword filters
const getArtistsByKeyword = createSelector(
  [getArtists, getFilterStr, getArtistSearcher],
  (artists, str, searcher) => {
    if (!str) return artists.result

    return searcher.search(str, {
      returnMatchData: true,
    }).map(match => match.item)
  })

const getSongsByKeyword = createSelector(
  [getSongs, getFilterStr, getSongSearcher],
  (songs, str, searcher) => {
    if (!str) return songs.result

    return searcher.search(str, {
      returnMatchData: true,
    }).map(match => match.item)
  })

// #2: starred/hidden filters
const getArtistsByView = createSelector(
  [getArtistsByKeyword, getFilterStarred, getStarredArtists],
  (artistsWithKeyword, filterStarred, starredArtists) =>
    artistsWithKeyword.filter(artistId => {
      return filterStarred ? starredArtists.includes(artistId) : true
    })
)

const getSongsByView = createSelector(
  [getSongsByKeyword, getFilterStarred, getStarredSongs],
  (songsWithKeyword, filterStarred, starredSongs) =>
    songsWithKeyword.filter(songId => {
      return filterStarred ? starredSongs.includes(songId) : true
    })
)

const mapStateToProps = (state) => {
  return {
    artists: state.artists.entities,
    songs: state.songs.entities,
    starredArtistCounts: state.starCounts.artists,
    queuedSongs: getUpcomingSongs(state),
    starredSongs: getStarredSongs(state),
    expandedArtists: state.library.expandedArtists,
    alphaPickerMap: getAlphaPickerMap(state),
    scrollTop: state.library.scrollTop,
    isAdmin: state.user.isAdmin,
    isSearching: !!getFilterKeywords(state).length || getFilterStarred(state),
    isLoading: state.library.isLoading,
    isEmpty: state.songs.result.length === 0,
    ui: state.ui,
    // SearchResults view
    songsResult: getSongsByView(state),
    artistsResult: getArtistsByView(state),
    filterKeywords: getFilterKeywords(state),
    filterStarred: getFilterStarred(state),
    expandedArtistResults: state.library.expandedArtistResults,
  }
}

const mapActionCreators = {
  toggleArtistExpanded,
  toggleArtistResultExpanded,
  scrollArtists,
  showSongInfo,
  closeSongInfo,
}

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
