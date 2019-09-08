import {
  LIBRARY_PUSH,
  LIBRARY_PUSH_SONG,
} from 'shared/actionTypes'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [LIBRARY_PUSH]: (state, { payload }) => ({
    ...state,
    result: payload.songs.result,
    entities: payload.songs.entities,
  }),
  [LIBRARY_PUSH_SONG]: (state, { payload }) => ({
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
const initialState = {
  result: [],
  entities: {},
}

export default function songsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
