import { createAction, createReducer } from '@reduxjs/toolkit'
import type {
  ProviderFetchRequester,
  ProviderFetchStatus,
  ProviderFetchView,
  ProviderSearchError,
  ProviderSearchResult,
} from 'shared/types'
import {
  LIBRARY_FILTER_STRING,
  LIBRARY_FILTER_STRING_RESET,
  LIBRARY_FILTER_TOGGLE_STARRED,
  LIBRARY_PUSH,
  TOGGLE_ARTIST_EXPANDED,
  SCROLL_ARTISTS,
  SCROLL_SEARCH_RESULTS,
  PROVIDER_SEARCH_REQUEST,
  PROVIDER_SEARCH_CANCEL,
  PROVIDER_SEARCH_RESULT,
  PROVIDER_SEARCH_PROVIDER_ERROR,
  PROVIDER_SEARCH_COMPLETE,
  PROVIDER_SEARCH_CLEAR,
  PROVIDER_FETCH_REQUEST,
  PROVIDER_FETCH_CANCEL,
  PROVIDER_FETCH_STATUS,
  _ERROR,
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

export const providerSearchRequest = createAction<{ query: string, providerIds: number[] }>(PROVIDER_SEARCH_REQUEST)
export const providerSearchCancel = createAction(PROVIDER_SEARCH_CANCEL)
export const clearProviderSearch = createAction(PROVIDER_SEARCH_CLEAR)

const providerSearchResult = createAction<{ query: string, providerId: number, results: ProviderSearchResult[] }>(PROVIDER_SEARCH_RESULT)
const providerSearchProviderError = createAction<{ query: string, providerId: number, message: string }>(PROVIDER_SEARCH_PROVIDER_ERROR)
const providerSearchComplete = createAction<{ query: string }>(PROVIDER_SEARCH_COMPLETE)
// server rejected the request outright (no results or COMPLETE will follow)
const providerSearchRequestError = createAction(PROVIDER_SEARCH_REQUEST + _ERROR)

export type { ProviderFetchRequester, ProviderFetchStatus, ProviderFetchView }

export const providerFetchRequest = createAction<{
  providerId: number
  itemId: string
  title: string
  artist: string
  // optimistic display only; the server takes source/iconUrl from the provider
  source?: string
  iconUrl?: string
  duration?: number
  userId: number
  userDisplayName: string
  userDateUpdated: number
}>(PROVIDER_FETCH_REQUEST)
// userId: whose request to withdraw (a row in the queue); omitted, the
// caller's own, or every request in the room for an admin holding none
export const providerFetchCancel = createAction<{ providerId: number, itemId: string, userId?: number }>(PROVIDER_FETCH_CANCEL)
const providerFetchStatus = createAction<ProviderFetchView[]>(PROVIDER_FETCH_STATUS)

export const providerFetchKey = (providerId: number, itemId: string) => `${providerId}:${itemId}`

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
  providerSearchQuery: string
  isProviderSearchActive: boolean
  providerResults: ProviderSearchResult[]
  providerErrors: ProviderSearchError[]
  providerFetches: Record<string, ProviderFetchView>
}

const initialState: LibraryState = {
  isLoading: true,
  version: 0,
  filterStr: '',
  filterStarred: false,
  artistsScrollOffset: 0,
  searchScrollOffset: 0,
  expandedArtists: [],
  providerSearchQuery: '',
  isProviderSearchActive: false,
  providerResults: [],
  providerErrors: [],
  providerFetches: {},
}

const resetProviderSearch = (state: LibraryState) => {
  state.providerSearchQuery = ''
  state.isProviderSearchActive = false
  state.providerResults = []
  state.providerErrors = []
}

const libraryReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(setFilterStr, (state, { payload }) => {
      state.filterStr = payload
      state.searchScrollOffset = 0

      if (payload !== state.providerSearchQuery) {
        state.providerResults = []
        state.providerErrors = []
        state.isProviderSearchActive = false
      }
    })
    .addCase(resetFilterStr, (state) => {
      state.filterStr = ''
      state.searchScrollOffset = 0
      resetProviderSearch(state)
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
    .addCase(providerSearchRequest, (state, { payload }) => {
      state.providerSearchQuery = payload.query
      state.isProviderSearchActive = true
      state.providerResults = []
      state.providerErrors = []
      // The server omits items whose song is in the library, so 'complete'
      // entries (which only hide results) could only go stale, e.g. if the
      // song has since been removed
      for (const [k, item] of Object.entries(state.providerFetches)) {
        if (item.status === 'complete') delete state.providerFetches[k]
      }
    })
    .addCase(providerSearchResult, (state, { payload }) => {
      if (payload.query !== state.providerSearchQuery) return
      for (const r of payload.results) {
        state.providerResults.push(r)
      }
    })
    .addCase(providerSearchProviderError, (state, { payload }) => {
      if (payload.query !== state.providerSearchQuery) return
      state.providerErrors.push({ providerId: payload.providerId, message: payload.message })
    })
    .addCase(providerSearchComplete, (state, { payload }) => {
      if (payload.query !== state.providerSearchQuery) return
      state.isProviderSearchActive = false
    })
    .addCase(providerSearchCancel, (state) => {
      state.isProviderSearchActive = false
    })
    .addCase(providerSearchRequestError, (state) => {
      state.isProviderSearchActive = false
    })
    .addCase(clearProviderSearch, resetProviderSearch)
    .addCase(providerFetchRequest, (state, { payload }) => {
      const k = providerFetchKey(payload.providerId, payload.itemId)
      const existing = state.providerFetches[k]
      const requester: ProviderFetchRequester = {
        userId: payload.userId,
        userDisplayName: payload.userDisplayName,
        userDateUpdated: payload.userDateUpdated,
        timestamp: Math.floor(Date.now() / 1000),
      }
      // Already in flight (or done) for someone here: join it rather than
      // clobbering the server-pushed status
      if (existing && existing.status !== 'error' && existing.status !== 'canceled') {
        if (!existing.requests.some(r => r.userId === payload.userId)) existing.requests.push(requester)
        return
      }
      // A retry after an error keeps the other requesters, as the server does;
      // a canceled fetch has none left
      const others = existing?.status === 'error'
        ? existing.requests.filter(r => r.userId !== payload.userId)
        : []
      state.providerFetches[k] = {
        providerId: payload.providerId,
        itemId: payload.itemId,
        status: 'pending',
        progress: 0,
        title: payload.title,
        artist: payload.artist,
        source: payload.source,
        iconUrl: payload.iconUrl,
        duration: payload.duration,
        requests: [...others, requester],
      }
    })
    .addCase(providerFetchStatus, (state, { payload }) => {
      for (const item of payload) {
        state.providerFetches[providerFetchKey(item.providerId, item.itemId)] = item
      }
    })
})

export default libraryReducer
