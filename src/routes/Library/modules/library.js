import {
  LIBRARY_FILTER_STRING,
  LIBRARY_FILTER_STRING_RESET,
  LIBRARY_FILTER_STATUS,
  TOGGLE_ARTIST_EXPANDED,
  TOGGLE_ARTIST_RESULT_EXPANDED,
  SCROLL_ARTISTS,
} from 'constants/actions'

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

export function setFilterString (str) {
  return {
    type: LIBRARY_FILTER_STRING,
    payload: str,
    meta: {
      throttle: {
        wait: 300,
        leading: false,
      }
    },
  }
}

export function resetFilterString () {
  return {
    type: LIBRARY_FILTER_STRING_RESET,
  }
}

export function setFilterStatus (status) {
  return {
    type: LIBRARY_FILTER_STATUS,
    payload: status,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [LIBRARY_FILTER_STRING]: (state, { payload }) => ({
    ...state,
    filterString: payload,
  }),
  [LIBRARY_FILTER_STRING_RESET]: (state, { payload }) => ({
    ...state,
    filterString: '',
  }),
  [LIBRARY_FILTER_STATUS]: (state, { payload }) => ({
    ...state,
    filterStatus: payload,
  }),
  [SCROLL_ARTISTS]: (state, { payload }) => ({
    ...state,
    scrollTop: payload,
  }),
  [TOGGLE_ARTIST_EXPANDED]: (state, { payload }) => {
    let list = state.expandedArtists.slice()
    const i = list.indexOf(payload)
    i === -1 ? list.push(payload) : list.splice(i, 1)

    return {
      ...state,
      expandedArtists: list,
    }
  },
  [TOGGLE_ARTIST_RESULT_EXPANDED]: (state, { payload }) => {
    let list = state.expandedArtistResults.slice()
    const i = list.indexOf(payload)
    i === -1 ? list.push(payload) : list.splice(i, 1)

    return {
      ...state,
      expandedArtistResults: list,
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  filterString: '',
  filterStatus: '', // '' (all), 'starred', 'hidden'
  scrollTop: 0,
  expandedArtists: [],
  expandedArtistResults: [],
}

export default function libraryReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
