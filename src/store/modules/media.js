import {
  MEDIA_PUSH,
} from 'constants/actions'

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [MEDIA_PUSH]: (state, { payload }) => payload
}

// ------------------------------------
// Reducer
// ------------------------------------
let initialState = []

export default function mediaReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
