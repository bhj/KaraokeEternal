import {
  LIBRARY_SEARCH,
  LIBRARY_SEARCH_RESET,
  LIBRARY_UPDATE,
  SONG_UPDATE,
} from 'constants'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [LIBRARY_SEARCH]: (state, {payload}) => {
    let songResults
    let term = payload.trim()

    if (term === '') {
      return {
        ...state,
        searchResult: [],
      }
    }

    term = term.toLowerCase()

    songResults = state.result.filter((songId, i) => {
      const str = state.entities[songId].title.toLowerCase()
      return str.indexOf(term) !== -1
    })

    return {
      ...state,
      searchResult: songResults,
    }
  },
  [LIBRARY_SEARCH_RESET]: (state, {payload}) => ({
    ...state,
    searchResult: [],
  }),
  [LIBRARY_UPDATE]: (state, {payload}) => ({
    ...payload.songs,
  }),
  [SONG_UPDATE]: (state, {payload}) => ({
    ...state,
    entities: {
      ...state.entities,
      [payload.songId]: payload,
    }
  })
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  result: [],
  entities: {},
  searchResult: [],
}

export default function songsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
