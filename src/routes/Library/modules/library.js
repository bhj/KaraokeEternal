import {
  LIBRARY_UPDATE,
  LIBRARY_SEARCH,
  LIBRARY_SEARCH_RESET,
} from 'constants'

const SCROLL_ARTISTS = 'library/SCROLL_ARTISTS'
export function scrollArtists (scrollTop) {
  return {
    type: SCROLL_ARTISTS,
    payload: scrollTop,
  }
}

const ARTIST_EXPAND_TOGGLE = 'library/ARTIST_EXPAND_TOGGLE'
export function toggleArtistExpanded (artistId) {
  return {
    type: ARTIST_EXPAND_TOGGLE,
    payload: artistId,
  }
}

const ARTIST_RESULT_EXPAND_TOGGLE = 'library/ARTIST_RESULT_EXPAND_TOGGLE'
export function toggleArtistResultExpanded (artistId) {
  return {
    type: ARTIST_RESULT_EXPAND_TOGGLE,
    payload: artistId,
  }
}

export function searchLibrary (term) {
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

export function searchReset () {
  return {
    type: LIBRARY_SEARCH_RESET,
    payload: null,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [LIBRARY_UPDATE]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [LIBRARY_SEARCH]: (state, { payload }) => {
    const { artists, media } = state
    let artistResults, songResults
    let term = payload.trim().toLowerCase()

    if (term === '') {
      return {
        ...state,
        artistSearchResult: [],
        songSearchResult: [],
        searchTerm: '',
      }
    }

    artistResults = artists.result.filter(id => {
      const artistName = artists.entities[id].name.toLowerCase()
      return artistName.includes(term)
    })

    songResults = media.result.filter((id, i) => {
      const songTitle = media.entities[id].title.toLowerCase()
      return songTitle.includes(term)
    })

    return {
      ...state,
      artistSearchResult: artistResults,
      songSearchResult: songResults,
      searchTerm: payload,
    }
  },
  [LIBRARY_SEARCH_RESET]: (state, { payload }) => ({
    ...state,
    searchTerm: '',
    artistSearchResult: [],
    songSearchResult: [],
  }),
  [SCROLL_ARTISTS]: (state, { payload }) => ({
    ...state,
    scrollTop: payload,
  }),
  [ARTIST_EXPAND_TOGGLE]: (state, { payload }) => {
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
  [ARTIST_RESULT_EXPAND_TOGGLE]: (state, { payload }) => {
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
  artists: { result: [], entities: {} },
  media: { result: [], entities: {} },
  searchTerm: '',
  artistSearchResult: [],
  songSearchResult: [],
  scrollTop: 0,
  expandedArtists: [],
  expandedArtistResults: [],
}

export default function libraryReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
