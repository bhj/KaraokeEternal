import {
  PLAYER_BG_ALPHA_REQUEST,
  PLAYER_PLAY_REQUEST,
  PLAYER_PAUSE_REQUEST,
  PLAYER_NEXT_REQUEST,
  PLAYER_VISUALIZER_REQUEST,
  PLAYER_VISUALIZER_PRESET_REQUEST,
  PLAYER_VOLUME_REQUEST,
  PLAYER_STATUS,
  PLAYER_LEAVE,
} from 'shared/actionTypes'

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
  [PLAYER_LEAVE]: (state, { payload }) => ({
    ...state,
    isPlayerPresent: false,
  }),
  [PLAYER_STATUS]: (state, { payload }) => ({
    ...state,
    ...payload,
    isPlayerPresent: true,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  bgAlpha: 1,
  errorMessage: '',
  history: [], // queueIds
  isAtQueueEnd: false,
  isErrored: false,
  isPlayerPresent: false,
  isPlaying: false,
  position: 0,
  queueId: -1,
  visualizer: {},
  volume: 1,
}

export default function status (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
