import {
  SONG_STARRED,
  SONG_UNSTARRED,
  STAR_COUNTS_PUSH,
} from 'shared/actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [SONG_STARRED]: (state, { payload }) => ({
    ...state,
    songs: {
      ...state.songs,
      [payload.songId]: ++state.songs[payload.songId] || 1,
    },
    version: payload.version,
  }),
  [SONG_UNSTARRED]: (state, { payload }) => ({
    ...state,
    songs: {
      ...state.songs,
      [payload.songId]: Math.max(--state.songs[payload.songId], 0),
    },
    version: payload.version,
  }),
  [STAR_COUNTS_PUSH]: (state, { payload }) => ({
    ...payload,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  artists: {},
  songs: {},
  version: 0,
}

export default function starCountsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
