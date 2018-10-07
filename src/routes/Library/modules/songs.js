import {
  LIBRARY_PUSH,
  LIBRARY_PUSH_SONG,
  SONG_STARRED,
  SONG_UNSTARRED,
} from 'shared/actions'

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
  [SONG_STARRED]: (state, { payload }) => {
    if (!state.entities[payload.songId]) return state

    return {
      ...state,
      entities: {
        ...state.entities,
        [payload.songId]: {
          ...state.entities[payload.songId],
          numStars: Math.max(++state.entities[payload.songId].numStars, 0),
        },
      }
    }
  },
  [SONG_UNSTARRED]: (state, { payload }) => {
    if (!state.entities[payload.songId]) return state

    return {
      ...state,
      entities: {
        ...state.entities,
        [payload.songId]: {
          ...state.entities[payload.songId],
          numStars: Math.max(--state.entities[payload.songId].numStars, 0),
        },
      }
    }
  },
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
