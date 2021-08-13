import {
  SONG_STARRED,
  SONG_UNSTARRED,
  STAR_COUNTS_PUSH,
} from 'shared/actionTypes'

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
  }),
  [SONG_UNSTARRED]: (state, { payload }) => ({
    ...state,
    songs: {
      ...state.songs,
      [payload.songId]: Math.max(--state.songs[payload.songId], 0),
    },
  }),
  [STAR_COUNTS_PUSH]: (state, { payload }) => ({
    ...payload,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  artists: {},
  songs: {},
  version: 0,
}

export default function starCountsReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
