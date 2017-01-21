// emitted from server
const LIBRARY_CHANGE = 'library/LIBRARY_CHANGE'

export const SCROLL_ARTISTS = 'library/SCROLL_ARTISTS'
export function scrollArtists(scrollTop) {
  return {
    type: SCROLL_ARTISTS,
    payload: scrollTop,
    meta: {
      throttle: {
        wait: 1000,
        leading: false,
      }
    },
  }
}

export const ARTIST_EXPAND_TOGGLE = 'library/ARTIST_EXPAND_TOGGLE'
export function toggleArtistExpanded(artistId) {
  return {
    type: ARTIST_EXPAND_TOGGLE,
    payload: artistId,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [LIBRARY_CHANGE]: (state, {payload}) => ({
    ...state,
    artists: payload.artists,
    songs: payload.songs,
  }),
  [SCROLL_ARTISTS]: (state, {payload}) => ({
    ...state,
    scrollTop: payload,
  }),
  [ARTIST_EXPAND_TOGGLE]: (state, {payload}) => {
    let expandedArtists = state.expandedArtists.slice()
    const i = expandedArtists.indexOf(payload)

    if (i === -1) {
      expandedArtists.push(payload)
    } else {
      expandedArtists.splice(i, 1)
    }

    return {
      ...state,
      expandedArtists,
    }
  }
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  artists: {result: [], entities:{}},
  songs: {result: [], entities:{}},
  isFetching: false,
  scrollTop: 0,
  expandedArtists: [],
}

export default function libraryReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
