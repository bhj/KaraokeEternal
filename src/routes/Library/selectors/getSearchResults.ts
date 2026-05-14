import { ensureState } from 'redux-optimistic-ui'
import { createSelector } from '@reduxjs/toolkit'
import { Searcher } from 'fast-fuzzy'
import { RootState } from 'store/store'

const THRESHOLD = 0.6

const getArtists = (state: RootState) => state.artists
const getSongs = (state: RootState) => state.songs
const getFilterStr = (state: RootState) => state.library.filterStr.trim().toLowerCase()
const getFilterStarred = (state: RootState) => state.library.filterStarred
const getStarredSongs = (state: RootState) => ensureState(state.userStars).starredSongs

const getSongSearcher = createSelector(
  [getSongs, getArtists],
  (songs, artists) => new Searcher(songs.result as unknown as object[], {
    keySelector: ((songId: number) => {
      const song = songs.entities[songId]
      const artist = artists.entities[song.artistId]
      return `${artist?.name ?? ''} ${song.title}`
    }) as unknown as (s: object) => string,
    threshold: THRESHOLD,
  }),
)

const getRankedSongs = createSelector(
  [getSongs, getFilterStr, getSongSearcher],
  (songs, filterStr, searcher) => {
    if (!filterStr) return songs.result

    const tokens = filterStr.split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return songs.result

    // run each token through the trie-backed searcher; intersect across tokens
    let scores: Map<number, number> | null = null

    for (const token of tokens) {
      const matches = searcher.search(token, { returnMatchData: true })
      const tokenScores = new Map<number, number>()
      for (const m of matches) {
        tokenScores.set(m.item as unknown as number, m.score)
      }

      if (scores === null) {
        scores = tokenScores
      } else {
        // intersect: keep only songs present in every token's matches; sum scores
        const next = new Map<number, number>()
        for (const [id, prev] of scores) {
          const s = tokenScores.get(id)
          if (s !== undefined) next.set(id, prev + s)
        }
        scores = next
      }

      if (scores.size === 0) return []
    }

    if (!scores) return songs.result

    return [...scores.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1]
        const titleA = songs.entities[a[0]]?.title ?? ''
        const titleB = songs.entities[b[0]]?.title ?? ''
        return titleA.localeCompare(titleB)
      })
      .map(([id]) => id)
  },
)

const getSongsByView = createSelector(
  [getRankedSongs, getFilterStarred, getStarredSongs],
  (rankedSongs, filterStarred, starredSongs) =>
    filterStarred
      ? rankedSongs.filter(songId => starredSongs.includes(songId))
      : rankedSongs,
)

const getSearchResults = createSelector(
  [getSongsByView],
  songsResult => ({ songsResult }),
)

export default getSearchResults
