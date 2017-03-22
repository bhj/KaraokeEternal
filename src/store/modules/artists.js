import {
  LIBRARY_SEARCH,
  LIBRARY_SEARCH_RESET,
  LIBRARY_UPDATE,
  ARTIST_UPDATE,
} from 'constants'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [LIBRARY_SEARCH]: (state, {payload}) => {
    let artistResults
    let term = payload.trim()

    if (term === '') {
      return {
        ...state,
        searchResult: [],
      }
    }

    term = term.toLowerCase()

    artistResults = state.result.filter((artistId, i) => {
      const str = state.entities[artistId].name.toLowerCase()
      return str.indexOf(term) !== -1
    })

    return {
      ...state,
      searchResult: artistResults,
    }
  },
  [LIBRARY_SEARCH_RESET]: (state, {payload}) => ({
    ...state,
    searchResult: [],
  }),
  [LIBRARY_UPDATE]: (state, {payload}) => ({
    ...payload.artists,
  }),
  [ARTIST_UPDATE]: (state, {payload}) => ({
    ...state,
    entities: {
      ...state.entities,
      [payload.artistId]: payload,
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

export default function artistsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
