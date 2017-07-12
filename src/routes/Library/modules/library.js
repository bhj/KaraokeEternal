import {
  LIBRARY_UPDATE,
  LIBRARY_UPDATE_REQUEST,
  LIBRARY_UPDATE_STATUS,
  LIBRARY_UPDATE_CANCEL,
  LIBRARY_SEARCH,
  LIBRARY_SEARCH_RESET,
  SONG_UPDATE
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

export function requestUpdate (provider) {
  return {
    type: LIBRARY_UPDATE_REQUEST,
    payload: provider,
  }
}

export function cancelUpdate () {
  return {
    type: LIBRARY_UPDATE_CANCEL,
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
  [LIBRARY_UPDATE_STATUS]: (state, { payload }) => ({
    ...state,
    isUpdating: !payload.complete,
    updateText: payload.text || '',
    updateProgress: payload.progress || 0,
  }),
  [SONG_UPDATE]: (state, { payload }) => ({
    ...state,
    songs: {
      ...state.songs,
      entities: {
        ...state.songs.entities,
        [payload.songId]: payload,
      }
    }
  }),
  [LIBRARY_SEARCH]: (state, { payload }) => {
    const { artists, songs } = state
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

    songResults = songs.result.filter((id, i) => {
      const songTitle = songs.entities[id].title.toLowerCase()
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
  songs: { result: [], entities: {} },
  searchTerm: '',
  artistSearchResult: [],
  songSearchResult: [],
  scrollTop: 0,
  expandedArtists: [],
  expandedArtistResults: [],
  // update status
  isUpdating: false,
  updateText: '',
  updateProgress: 0,
}

export default function libraryReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
