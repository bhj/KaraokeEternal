import {
  PLAYER_STATUS,
  PLAYER_ERROR,
  PLAYER_LEAVE,
} from 'constants'

// ------------------------------------
// Actions
// ------------------------------------

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_LEAVE]: (state, { payload }) => {
    return {
      ...state,
      isPlayerPresent: false,
      isPlaying: false,
    }
  },
  [PLAYER_STATUS]: (state, { payload }) => {
    return {
      ...state,
      ...payload,
      isPlayerPresent: true,
    }
  },
  [PLAYER_ERROR]: (state, { payload }) => {
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
  isPlayerPresent: false,
  errors: {},   // object of arrays keyed by queueId
}

export default function status (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
