import { createAction, createReducer } from '@reduxjs/toolkit'
import {
  LIBRARY_FILTER_STRING,
  LIBRARY_FILTER_STRING_RESET,
  LIBRARY_FILTER_TOGGLE_STARRED,
  LIBRARY_PUSH,
  TOGGLE_ARTIST_EXPANDED,
  SCROLL_ARTISTS,
  SCROLL_SEARCH_RESULTS,
} from 'shared/actionTypes'

// ------------------------------------
// Actions
// ------------------------------------
export const scrollArtists = createAction<number>(SCROLL_ARTISTS)
export const scrollSearchResults = createAction<number>(SCROLL_SEARCH_RESULTS)
export const toggleArtistExpanded = createAction<number>(TOGGLE_ARTIST_EXPANDED)
const libraryPush = createAction<LibraryState>(LIBRARY_PUSH)

export const resetFilterStr = createAction(LIBRARY_FILTER_STRING_RESET)
export const toggleFilterStarred = createAction<void>(LIBRARY_FILTER_TOGGLE_STARRED)
export const setFilterStr = createAction(LIBRARY_FILTER_STRING, (payload: string) => ({
  payload,
  meta: {
    throttle: {
      wait: 350,
      leading: false,
    },
  },
}))

// ------------------------------------
// Reducer
// ------------------------------------
export interface LibraryState {
  isLoading: boolean
  version: number
  filterStr: string
  filterStarred: boolean
  artistsScrollOffset: number
  searchScrollOffset: number
  expandedArtists: number[]
}

const initialState: LibraryState = {
  isLoading: true,
  version: 0,
  filterStr: '',
  filterStarred: false,
  artistsScrollOffset: 0,
  searchScrollOffset: 0,
  expandedArtists: [],
}

const libraryReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setFilterStr, (state, { payload }) => {
      state.filterStr = payload
      state.searchScrollOffset = 0
    })
    .addCase(resetFilterStr, (state) => {
      state.filterStr = ''
      state.searchScrollOffset = 0
    })
    .addCase(toggleFilterStarred, (state) => {
      state.filterStarred = !state.filterStarred
      state.searchScrollOffset = 0
    })
    .addCase(scrollArtists, (state, { payload }) => {
      state.artistsScrollOffset = payload
    })
    .addCase(scrollSearchResults, (state, { payload }) => {
      state.searchScrollOffset = payload
    })
    .addCase(toggleArtistExpanded, (state, { payload }) => {
      const idx = state.expandedArtists.indexOf(payload)

      if (idx === -1) state.expandedArtists.push(payload)
      else state.expandedArtists.splice(idx, 1)
    })
    .addCase(libraryPush, (state, { payload }) => ({
      ...state,
      isLoading: false,
      version: payload.version,
    }))
})

export default libraryReducer
