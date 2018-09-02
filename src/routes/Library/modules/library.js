import HttpApi from 'lib/HttpApi'
import {
  LIBRARY_FILTER_STRING,
  LIBRARY_FILTER_STRING_RESET,
  LIBRARY_FILTER_TOGGLE_STARRED,
  LIBRARY_SONG_INFO_REQUEST,
  LIBRARY_SONG_INFO_CLOSE,
  TOGGLE_ARTIST_EXPANDED,
  TOGGLE_ARTIST_RESULT_EXPANDED,
  SCROLL_ARTISTS,
  _SUCCESS,
  _ERROR,
} from 'constants/actions'

const api = new HttpApi('library')

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
// Song info/edit
// ------------------------------------
export function showSongInfo (songId) {
  return (dispatch, getState) => {
    dispatch(requestSongInfo(songId))

    return api('GET', `/song/${songId}`)
      .then(res => {
        dispatch(receiveSongInfo(res))
      }).catch(err => {
        dispatch(songInfoError(err))
      })
  }
}

function requestSongInfo (songId) {
  return {
    type: LIBRARY_SONG_INFO_REQUEST,
    payload: { songId }
  }
}

function receiveSongInfo (res) {
  return {
    type: LIBRARY_SONG_INFO_REQUEST + _SUCCESS,
    payload: res
  }
}

function songInfoError (err) {
  return {
    type: LIBRARY_SONG_INFO_REQUEST + _ERROR,
    error: err.message,
  }
}

export function closeSongInfo () {
  return {
    type: LIBRARY_SONG_INFO_CLOSE,
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
  [LIBRARY_SONG_INFO_REQUEST]: (state, { payload }) => ({
    ...state,
    isSongInfoOpen: true,
    songInfoMedia: { result: [], entities: {} },
  }),
  [LIBRARY_SONG_INFO_REQUEST + _SUCCESS]: (state, { payload }) => ({
    ...state,
    songInfoMedia: payload,
  }),
  [LIBRARY_SONG_INFO_REQUEST + _ERROR]: (state, { payload }) => ({
    ...state,
    isSongInfoOpen: false,
  }),
  [LIBRARY_SONG_INFO_CLOSE]: (state, { payload }) => ({
    ...state,
    isSongInfoOpen: false,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  filterStr: '',
  filterStarred: false,
  scrollTop: 0,
  expandedArtists: [],
  expandedArtistResults: [],
  // song info modal
  isSongInfoOpen: false,
  songInfoMedia: { result: [], entities: {} },
}

export default function libraryReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
