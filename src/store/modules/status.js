// ------------------------------------
// Constants
// ------------------------------------
const PLAYBACK_STATUS = 'status/PLAYBACK_STATUS'
const PLAYBACK_ERROR = 'status/PLAYBACK_ERROR'
const EMIT_STATUS = 'server/PLAYER_STATUS'
const PLAYER_QUEUE_END = 'player/PLAYER_QUEUE_END'

// ------------------------------------
// Actions
// ------------------------------------

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYBACK_STATUS]: (state, {payload}) => {
    return {
      ...state,
      queueId: payload.queueId,
      position: payload.position,
      volume: payload.volume,
      isPlaying: payload.isPlaying,
    }
  },
  // if we're acting as Player, listen to our own
  // status since it won't be emitted back at us
  [EMIT_STATUS]: (state, {payload}) => {
    return {
      ...state,
      queueId: payload.queueId,
      position: payload.position,
      volume: payload.volume,
      isPlaying: payload.isPlaying,
    }
  },
  [PLAYBACK_ERROR]: (state, {payload}) => {
    const {queueId, message} = payload

    return {
      ...state,
      errors: {
        ...state.errors,
        // can be multiple errors for a media item
        [queueId]: state.errors[queueId] ? state.errors[queueId].concat(message) : [message]
      }
    }
  },
  [PLAYER_QUEUE_END]: (state, {payload}) => ({
    ...state,
    isAtQueueEnd: true,
  }),
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
