import { createAction, createReducer } from '@reduxjs/toolkit'
import {
  LIBRARY_FILTER_STRING,
  LIBRARY_FILTER_STRING_RESET,
  LIBRARY_FILTER_TOGGLE_STARRED,
  LIBRARY_PUSH,
  TOGGLE_ARTIST_EXPANDED,
  TOGGLE_ARTIST_RESULT_EXPANDED,
  SCROLL_ARTISTS,
} from 'shared/actionTypes'

// ------------------------------------
// Actions
// ------------------------------------
export const scrollArtists = createAction(SCROLL_ARTISTS)
export const toggleArtistExpanded = createAction(TOGGLE_ARTIST_EXPANDED)
export const toggleArtistResultExpanded = createAction(TOGGLE_ARTIST_RESULT_EXPANDED)

export const resetFilterStr = createAction(LIBRARY_FILTER_STRING_RESET)
export const toggleFilterStarred = createAction(LIBRARY_FILTER_TOGGLE_STARRED)
export const setFilterStr = createAction(LIBRARY_FILTER_STRING, (str) => ({
  payload: { str },
  meta: {
    throttle: {
      wait: 350,
      leading: false,
    }
  },
}))

// ------------------------------------
// Reducer
// ------------------------------------
interface libraryState {
  isLoading: boolean
  version: number
  filterStr: string
  filterStarred: boolean
  scrollTop: number
  expandedArtists: number[]
  expandedArtistResults: number[]
}

const initialState: libraryState = {
  isLoading: true,
  version: 0,
  filterStr: '',
  filterStarred: false,
  scrollTop: 0,
  expandedArtists: [],
  expandedArtistResults: [],
}

const libraryReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setFilterStr, (state, { payload }) => {
      state.filterStr = payload.str
    })
    .addCase(resetFilterStr, (state) => {
      state.filterStr = ''
    })
    .addCase(toggleFilterStarred, (state) => {
      state.filterStarred = !state.filterStarred
    })
    .addCase(scrollArtists, (state, { payload }) => {
      state.scrollTop = payload
    })
    .addCase(toggleArtistExpanded, (state, { payload }) => {
      const idx = state.expandedArtists.indexOf(payload)
      idx === -1 ? state.expandedArtists.push(payload) : state.expandedArtists.splice(idx, 1)
    })
    .addCase(toggleArtistResultExpanded, (state, { payload }) => {
      const idx = state.expandedArtistResults.indexOf(payload)
      idx === -1 ? state.expandedArtistResults.push(payload) : state.expandedArtistResults.splice(idx, 1)
    })
    .addCase(LIBRARY_PUSH, (state, { payload }) => ({
      ...state,
      isLoading: false,
      version: payload.version,
    }))
})

export default libraryReducer
