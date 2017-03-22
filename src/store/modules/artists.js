import { LIBRARY_UPDATE, ARTIST_UPDATE } from 'constants'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
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
}

export default function artistsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
