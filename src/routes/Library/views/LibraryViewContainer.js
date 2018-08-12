import { connect } from 'react-redux'
import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from 'reselect'
import { Searcher } from 'fast-fuzzy'
import LibraryView from './LibraryView'
import {
  scrollArtists,
  toggleArtistExpanded,
  toggleArtistResultExpanded,
} from '../modules/library'

const getArtists = (state) => state.artists
const getSongs = (state) => state.songs
const getFilterStr = (state) => state.library.filterStr.trim().toLowerCase()
const getFilterStarred = (state) => state.library.filterStarred
const getStarredArtists = (state) => state.user.starredArtists
const getStarredSongs = (state) => state.user.starredSongs
const getQueue = (state) => ensureState(state.queue)
const getCurrentQueueId = (state) => state.status.queueId

const getQueuedSongs = createSelector(
  [getQueue, getCurrentQueueId],
  (queue, curId) => {
    const curPos = queue.result.indexOf(curId)
    return queue.result.slice(curPos + 1).map(queueId => queue.entities[queueId].songId)
  }
)

const getFilterKeywords = createSelector(
  [getFilterStr],
  (str) => str.length ? str.split(' ') : []
)

const getAlphaPickerMap = createSelector(
  [getArtists],
  (artists) => {
    const map = {}
    const chars = '#ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    let c = 1 // skip '#' since it should always be 0 (top)

    // prefill with zeros
    chars.forEach(char => { map[char] = 0 })

    artists.result.forEach((artistId, i) => {
      if (artists.entities[artistId].name.toUpperCase().startsWith(chars[c])) {
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
    queuedSongIds: getQueuedSongs(state),
    starredSongs: state.user.starredSongs,
    expandedArtists: state.library.expandedArtists,
    alphaPickerMap: getAlphaPickerMap(state),
    scrollTop: state.library.scrollTop,
    isSearching: !!getFilterKeywords(state).length || getFilterStarred(state),
    isLibraryEmpty: state.songs.result.length === 0,
    isShowingSongInfo: !(state.library.songInfoSongId === null),
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
}

export default connect(mapStateToProps, mapActionCreators)(LibraryView)
