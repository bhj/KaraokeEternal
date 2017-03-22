import { LIBRARY_UPDATE, SONG_UPDATE } from 'constants'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
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
}

export default function songsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
