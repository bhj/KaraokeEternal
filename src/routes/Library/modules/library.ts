import { createAction, createReducer } from '@reduxjs/toolkit'
import {
  LIBRARY_FILTER_STRING,
  LIBRARY_FILTER_STRING_RESET,
  LIBRARY_FILTER_TOGGLE_STARRED,
  LIBRARY_PUSH,
  TOGGLE_ARTIST_EXPANDED,
  SCROLL_ARTISTS,
} from 'shared/actionTypes'

// ------------------------------------
// Actions
// ------------------------------------
export const scrollArtists = createAction<number>(SCROLL_ARTISTS)
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
  scrollRow: number
  expandedArtists: number[]
}

const initialState: LibraryState = {
  isLoading: true,
  version: 0,
  filterStr: '',
  filterStarred: false,
  scrollRow: 0,
  expandedArtists: [],
}

const libraryReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setFilterStr, (state, { payload }) => {
      state.filterStr = payload
    })
    .addCase(resetFilterStr, (state) => {
      state.filterStr = ''
    })
    .addCase(toggleFilterStarred, (state) => {
      state.filterStarred = !state.filterStarred
    })
    .addCase(scrollArtists, (state, { payload }) => {
      state.scrollRow = payload
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
