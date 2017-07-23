import {
  LIBRARY_UPDATE,
  LIBRARY_REQUEST_SCAN,
  LIBRARY_REQUEST_SCAN_CANCEL,
  LIBRARY_SCAN_STATUS,
  LIBRARY_SCAN_COMPLETE,
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

// ------------------------------------
// request media scan
// ------------------------------------
export function requestScan (provider) {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: LIBRARY_REQUEST_SCAN,
      payload: provider,
    })

    return fetch(`/api/library/scan?provider=${provider}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
      .then(checkStatus)
      .catch(err => {
        dispatch({
          type: LIBRARY_REQUEST_SCAN + '_ERROR',
          meta: { error: err.message },
        })
      })
  }
}

// ------------------------------------
// request cancelation of media scan
// ------------------------------------
export function requestScanCancel (provider) {
  return (dispatch, getState) => {
    // informational
    dispatch({
      type: LIBRARY_REQUEST_SCAN_CANCEL,
      payload: null,
    })

    return fetch(`/api/library/scan/cancel`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    })
      .then(checkStatus)
      .catch(err => {
        dispatch({
          type: LIBRARY_REQUEST_SCAN_CANCEL + '_ERROR',
          meta: { error: err.message },
        })
      })
  }
}

// helper for fetch response
function checkStatus (response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    return response.text().then((txt) => {
      var error = new Error(txt)
      error.response = response
      throw error
    })
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
  [LIBRARY_SCAN_STATUS]: (state, { payload }) => ({
    ...state,
    isUpdating: true,
    updateText: payload.text,
    updateProgress: payload.progress,
  }),
  [LIBRARY_SCAN_COMPLETE]: (state, { payload }) => ({
    ...state,
    isUpdating: false,
    updateText: '',
    updateProgress: 0,
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
