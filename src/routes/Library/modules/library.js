import {
  LIBRARY_FILTER_STRING,
  LIBRARY_FILTER_STRING_RESET,
  LIBRARY_FILTER_TOGGLE_STARRED,
  LIBRARY_PUSH,
  TOGGLE_ARTIST_EXPANDED,
  TOGGLE_ARTIST_RESULT_EXPANDED,
  SCROLL_ARTISTS,
} from 'shared/actionTypes'

export function scrollArtists (scrollTop) {
  return {
    type: SCROLL_ARTISTS,
    payload: scrollTop,
  }
}

export function toggleArtistExpanded (artistId) {
  return {
    type: TOGGLE_ARTIST_EXPANDED,
    payload: artistId,
  }
}

export function toggleArtistResultExpanded (artistId) {
  return {
    type: TOGGLE_ARTIST_RESULT_EXPANDED,
    payload: artistId,
  }
}

export function setFilterStr (str) {
  return {
    type: LIBRARY_FILTER_STRING,
    payload: { str },
    meta: {
      throttle: {
        wait: 350,
        leading: false,
      }
    },
  }
}

export function resetFilterStr () {
  return {
    type: LIBRARY_FILTER_STRING_RESET,
  }
}

export function toggleFilterStarred () {
  return {
    type: LIBRARY_FILTER_TOGGLE_STARRED,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [LIBRARY_FILTER_STRING]: (state, { payload }) => ({
    ...state,
    filterStr: payload.str,
  }),
  [LIBRARY_FILTER_STRING_RESET]: (state, { payload }) => ({
    ...state,
    filterStr: '',
  }),
  [LIBRARY_FILTER_TOGGLE_STARRED]: (state, { payload }) => ({
    ...state,
    filterStarred: !state.filterStarred,
  }),
  [SCROLL_ARTISTS]: (state, { payload }) => ({
    ...state,
    scrollTop: payload,
  }),
  [TOGGLE_ARTIST_EXPANDED]: (state, { payload }) => {
    const list = state.expandedArtists.slice()
    const i = list.indexOf(payload)
    i === -1 ? list.push(payload) : list.splice(i, 1)

    return {
      ...state,
      expandedArtists: list,
    }
  },
  [TOGGLE_ARTIST_RESULT_EXPANDED]: (state, { payload }) => {
    const list = state.expandedArtistResults.slice()
    const i = list.indexOf(payload)
    i === -1 ? list.push(payload) : list.splice(i, 1)

    return {
      ...state,
      expandedArtistResults: list,
    }
  },
  [LIBRARY_PUSH]: (state, { payload }) => ({
    ...state,
    isLoading: false,
    version: payload.version,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  isLoading: true,
  version: 0,
  filterStr: '',
  filterStarred: false,
  scrollTop: 0,
  expandedArtists: [],
  expandedArtistResults: [],
}

export default function libraryReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
