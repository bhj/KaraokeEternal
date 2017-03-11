const TOGGLE_SONG_STARRED = 'server/TOGGLE_SONG_STARRED'

export function toggleSongStarred(songId) {
  return {
    type: TOGGLE_SONG_STARRED,
    payload: songId,
    // meta: {isOptimistic: true},
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [TOGGLE_SONG_STARRED]: (state, {payload}) => {
    // make a copy
    const s = state.starredSongs.slice()

    if (s.includes(payload)) {
      // remove star
      s.splice(s.indexOf(payload), 1)
    } else {
      // add star
      s.push(payload)
    }

    return {
      ...state,
      starredSongs: s,
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = {
  starredSongs: [],
}

export default function starredSongs(state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
