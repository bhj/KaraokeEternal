import {
  REQUEST_PLAYER_PLAY,
  REQUEST_PLAYER_PAUSE,
  REQUEST_PLAYER_NEXT,
  REQUEST_PLAYER_VOLUME,
  PLAYER_STATUS,
  PLAYER_ERROR,
  PLAYER_ENTER,
  PLAYER_LEAVE,
} from 'constants/actions'

// ------------------------------------
// Actions
// ------------------------------------
export function requestPlay () {
  return {
    type: REQUEST_PLAYER_PLAY,
  }
}

export function requestPause () {
  return {
    type: REQUEST_PLAYER_PAUSE,
  }
}

export function requestPlayNext () {
  return {
    type: REQUEST_PLAYER_NEXT,
  }
}
export function requestVolume (vol) {
  return {
    type: REQUEST_PLAYER_VOLUME,
    payload: vol,
    meta: {
      throttle: {
        wait: 200,
        leading: false,
      }
    },
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_STATUS]: (state, { payload }) => {
    return {
      ...state,
      ...payload,
    }
  },
  [PLAYER_ENTER]: (state, { payload }) => {
    return {
      ...state,
      isPlayerPresent: true,
    }
  },
  [PLAYER_LEAVE]: (state, { payload }) => {
    return {
      ...state,
      isPlayerPresent: false,
    }
  },
  [PLAYER_ERROR]: (state, { payload }) => {
    const { queueId, msg } = payload

    return {
      ...state,
      errors: {
        ...state.errors,
        // can be multiple errors for a media item
        [queueId]: state.errors[queueId] ? state.errors[queueId].concat(msg) : [msg]
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
  errors: {}, // object of arrays keyed by queueId
}

export default function status (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
