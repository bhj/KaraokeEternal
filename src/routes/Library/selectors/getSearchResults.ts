import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from '@reduxjs/toolkit'
import { Searcher } from 'fast-fuzzy'
import { RootState } from 'store/store'

const getArtists = (state: RootState) => state.artists
const getSongs = (state: RootState) => state.songs
const getFilterStr = (state: RootState) => state.library.filterStr.trim().toLowerCase()
const getFilterStarred = (state: RootState) => state.library.filterStarred
const getStarredArtists = (state: RootState) => ensureState(state.userStars).starredArtists
const getStarredSongs = (state: RootState) => ensureState(state.userStars).starredSongs

const getArtistSearcher = createSelector(
  [getArtists],
  artists => new Searcher(artists.result as unknown as object[], {
    keySelector: ((artistId: number) => artists.entities[artistId].name) as unknown as (s: object) => string,
    threshold: 0.8,
  }),
)

const getSongSearcher = createSelector(
  [getSongs],
  songs => new Searcher(songs.result as unknown as object[], {
    keySelector: ((songId: number) => songs.entities[songId].title) as unknown as (s: object) => string,
    threshold: 0.8,
  }),
)

// #1: keyword filters
const getArtistsByKeyword = createSelector(
  [getArtists, getFilterStr, getArtistSearcher],
  (artists, str, searcher) => {
    if (!str) return artists.result

    return searcher.search(str, {
      returnMatchData: true,
    }).map(match => match.item as unknown as number)
  })

const getSongsByKeyword = createSelector(
  [getSongs, getFilterStr, getSongSearcher],
  (songs, str, searcher) => {
    if (!str) return songs.result

    return searcher.search(str, {
      returnMatchData: true,
    }).map(match => match.item as unknown as number)
  })

// #2: starred/hidden filters
const getArtistsByView = createSelector(
  [getArtistsByKeyword, getFilterStarred, getStarredArtists],
  (artistsWithKeyword, filterStarred, starredArtists) =>
    artistsWithKeyword.filter((artistId) => {
      return filterStarred ? starredArtists.includes(artistId) : true
    }),
)

const getSongsByView = createSelector(
  [getSongsByKeyword, getFilterStarred, getStarredSongs],
  (songsWithKeyword, filterStarred, starredSongs) =>
    songsWithKeyword.filter((songId) => {
      return filterStarred ? starredSongs.includes(songId) : true
    }),
)

const getSearchResults = createSelector(
  [getArtistsByView, getSongsByView],
  (artistsResult, songsResult) => ({
    artistsResult,
    songsResult,
  }),
)

export default getSearchResults
