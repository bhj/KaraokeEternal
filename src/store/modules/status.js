import { PLAYBACK_STATUS, PLAYBACK_ERROR } from 'constants'

// ------------------------------------
// Actions
// ------------------------------------

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYBACK_STATUS]: (state, { payload }) => {
    return {
      ...state,
      queueId: payload.queueId,
      position: payload.position,
      volume: payload.volume,
      isPlaying: payload.isPlaying,
      isAtQueueEnd: payload.isAtQueueEnd,
    }
  },
  [PLAYBACK_ERROR]: (state, { payload }) => {
    const { queueId, message } = payload

    return {
      ...state,
      errors: {
        ...state.errors,
        // can be multiple errors for a media item
        [queueId]: state.errors[queueId] ? state.errors[queueId].concat(message) : [message]
      }
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  queueId: -1,
  position: 0,
  volume: 1,
  isPlaying: false,
  isAtQueueEnd: false,
  errors: {},   // object of arrays keyed by queueId
}

export default function status (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
