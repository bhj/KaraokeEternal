import {
  PLAYER_BG_ALPHA_REQUEST,
  PLAYER_PLAY_REQUEST,
  PLAYER_PAUSE_REQUEST,
  PLAYER_NEXT_REQUEST,
  PLAYER_VISUALIZER_REQUEST,
  PLAYER_VISUALIZER_PRESET_REQUEST,
  PLAYER_VOLUME_REQUEST,
  PLAYER_STATUS,
  PLAYER_ERROR,
  PLAYER_LEAVE,
} from 'shared/actions'

// ------------------------------------
// Actions
// ------------------------------------
export function requestPlay () {
  return {
    type: PLAYER_PLAY_REQUEST,
  }
}

export function requestPause () {
  return {
    type: PLAYER_PAUSE_REQUEST,
  }
}

export function requestPlayNext () {
  return {
    type: PLAYER_NEXT_REQUEST,
  }
}

export function requestBackgroundAlpha (val) {
  return {
    type: PLAYER_BG_ALPHA_REQUEST,
    payload: val,
    meta: {
      throttle: {
        wait: 200,
        leading: false,
      }
    },
  }
}

export function requestVisualizer (payload) {
  return {
    type: PLAYER_VISUALIZER_REQUEST,
    payload,
    meta: {
      throttle: {
        wait: 200,
        leading: false,
      }
    },
  }
}

export function requestVisualizerPreset (mode) {
  return {
    type: PLAYER_VISUALIZER_PRESET_REQUEST,
    payload: { mode },
  }
}

export function requestVolume (vol) {
  return {
    type: PLAYER_VOLUME_REQUEST,
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
  bgAlpha: 1,
  queueId: -1,
  position: 0,
  volume: 1,
  isPlaying: false,
  isAtQueueEnd: false,
  isPlayerPresent: false,
  visualizer: {},
  errors: {}, // arrays, keyed by queueId
}

export default function status (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
