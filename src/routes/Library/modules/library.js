const SCROLL_ARTISTS = 'library/SCROLL_ARTISTS'
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

const ARTIST_EXPAND_TOGGLE = 'library/ARTIST_EXPAND_TOGGLE'
export function toggleArtistExpanded(artistId) {
  return {
    type: ARTIST_EXPAND_TOGGLE,
    payload: artistId,
  }
}

const ARTIST_RESULT_EXPAND_TOGGLE = 'library/ARTIST_RESULT_EXPAND_TOGGLE'
export function toggleArtistResultExpanded(artistId) {
  return {
    type: ARTIST_RESULT_EXPAND_TOGGLE,
    payload: artistId,
  }
}

const LIBRARY_SEARCH = 'library/SEARCH'
export function searchLibrary(term) {
  return {
    type: LIBRARY_SEARCH,
    payload: term,
    meta: {
      throttle: {
        wait: 300,
        leading: false,
      }
    },
  }
}

const LIBRARY_SEARCH_RESET = 'library/SEARCH_RESET'
export function searchReset() {
  return {
    type: LIBRARY_SEARCH_RESET,
    payload: null,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [LIBRARY_SEARCH]: (state, {payload}) => {
    let artistResults, songResults
    let term = payload.trim()

    if (term === '') {
      return {
        ...state,
        searchTerm: '',
        artistResults: [],
        expandedArtistResults: [],
        songResults: [],
      }
    }

    term = term.toLowerCase()

    artistResults = state.artists.result.filter((artistId, i) => {
      const str = state.artists.entities[artistId].name.toLowerCase()
      return str.indexOf(term) !== -1
    })

    songResults = state.songs.result.filter((songId, i) => {
      const str = state.songs.entities[songId].title.toLowerCase()
      return str.indexOf(term) !== -1
    })

    return {
      ...state,
      searchTerm: payload,
      artistResults,
      songResults,
    }
  },
  [LIBRARY_SEARCH_RESET]: (state, {payload}) => ({
    ...state,
    searchTerm: '',
    artistResults: [],
    expandedArtistResults: [],
    songResults: [],
  }),
  [SCROLL_ARTISTS]: (state, {payload}) => ({
    ...state,
    scrollTop: payload,
  }),
  [ARTIST_EXPAND_TOGGLE]: (state, {payload}) => {
    let list = state.expandedArtists.slice()
    const i = list.indexOf(payload)

    if (i === -1) {
      list.push(payload)
    } else {
      list.splice(i, 1)
    }

    return {
      ...state,
      expandedArtists: list,
    }
  },
  [ARTIST_RESULT_EXPAND_TOGGLE]: (state, {payload}) => {
    let list = state.expandedArtistResults.slice()
    const i = list.indexOf(payload)

    if (i === -1) {
      list.push(payload)
    } else {
      list.splice(i, 1)
    }

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
  scrollTop: 0,
  expandedArtists: [],
  searchTerm: '',
  artistResults: [],
  songResults: [],
  expandedArtistResults: [],
}

export default function libraryReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
