import {
  LIBRARY_PUSH,
  LIBRARY_SONG_UPDATE_PUSH,
} from 'constants/actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [LIBRARY_PUSH]: (state, { payload }) => ({
    ...state,
    result: payload.songs.result,
    entities: payload.songs.entities,
  }),
  [LIBRARY_SONG_UPDATE_PUSH]: (state, { payload }) => ({
    ...state,
    entities: {
      ...state.entities,
      ...payload,
    }
  }),
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
