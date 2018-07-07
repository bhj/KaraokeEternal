import { connect } from 'react-redux'
import { createSelector } from 'reselect'
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
const getQueue = (state) => state.queue
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

// #1: keyword filters
const getArtistsByKeyword = createSelector(
  [getArtists, getFilterStr, getFilterKeywords],
  (artists, str, keywords) => {
    if (!str) return artists.result

    return artists.result.map(id => {
      const item = artists.entities[id].name.toLowerCase()
      const itemScore = keywords.reduce((total, word, i) => {
        const pos = item.indexOf(word)
        const score = pos === -1 ? 0 : 1 - (pos / item.length)
        return total + (score / keywords.length)
      }, 0)

      return { artistId: id, score: itemScore }
    })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(score => score.artistId)
  })

const getSongsByKeyword = createSelector(
  [getSongs, getFilterStr, getFilterKeywords],
  (songs, str, keywords) => {
    return songs.result.map(id => {
      const item = songs.entities[id].title.toLowerCase()
      const itemScore = keywords.reduce((total, word, i) => {
        const pos = item.indexOf(word)
        const score = pos === -1 ? 0 : 1 - (pos / item.length)
        return total + (score / keywords.length)
      }, 0)

      return { songId: id, score: itemScore }
    })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(score => score.songId)
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
