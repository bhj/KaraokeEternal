import { CANCEL } from 'redux-throttle'
import {
  PLAYER_CMD_NEXT,
  PLAYER_CMD_OPTIONS,
  PLAYER_CMD_PAUSE,
  PLAYER_CMD_PLAY,
  PLAYER_CMD_VOLUME,
  PLAYER_EMIT_LEAVE,
  PLAYER_EMIT_STATUS,
  PLAYER_ERROR,
  PLAYER_LOAD,
  PLAYER_PLAY,
  PLAYER_STATUS,
} from 'shared/actionTypes'

// ------------------------------------
// Actions triggered by media events
// ------------------------------------
export function playerStatus (status = {}) {
  return {
    type: PLAYER_STATUS,
    payload: status,
  }
}

export function playerError (msg) {
  return {
    type: PLAYER_ERROR,
    payload: { message: msg },
  }
}

export function playerLoad () {
  return {
    type: PLAYER_LOAD,
  }
}

export function playerPlay () {
  return {
    type: PLAYER_PLAY,
  }
}

// ------------------------------------
// Actions for emitting to room
// ------------------------------------
export function emitStatus (cancelPrev = false) {
  return (dispatch, getState) => {
    if (cancelPrev) dispatch(cancelEmitStatus())

    dispatch({
      type: PLAYER_EMIT_STATUS,
      payload: {
        ...getState().player,
        visualizer: getState().playerVisualizer,
      },
      meta: {
        throttle: {
          wait: 1000,
          leading: true,
        }
      }
    })
  }
}

// cancel any throttled/queued status emits
export function cancelEmitStatus () {
  return {
    type: CANCEL,
    payload: {
      type: PLAYER_EMIT_STATUS,
    }
  }
}

export function emitLeave () {
  return (dispatch, getState) => {
    dispatch(cancelEmitStatus())
    dispatch({
      type: PLAYER_EMIT_LEAVE,
    })
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_CMD_NEXT]: (state, { payload }) => ({
    ...state,
    isPlayingNext: true,
  }),
  [PLAYER_CMD_OPTIONS]: (state, { payload }) => ({
    ...state,
    cdgAlpha: typeof payload.cdgAlpha === 'number' ? payload.cdgAlpha : state.cdgAlpha,
    cdgSize: typeof payload.cdgSize === 'number' ? payload.cdgSize : state.cdgSize,
  }),
  [PLAYER_CMD_PAUSE]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
  }),
  [PLAYER_CMD_PLAY]: (state, { payload }) => ({
    ...state,
    isPlaying: true,
  }),
  [PLAYER_CMD_VOLUME]: (state, { payload }) => ({
    ...state,
    volume: payload,
  }),
  [PLAYER_ERROR]: (state, { payload }) => ({
    ...state,
    errorMessage: payload.message,
    isErrored: true,
    isFetching: false,
    isPlaying: false,
  }),
  [PLAYER_LOAD]: (state, { payload }) => ({
    ...state,
    errorMessage: '',
    isErrored: false,
    isFetching: true,
  }),
  [PLAYER_PLAY]: (state, { payload }) => ({
    ...state,
    isFetching: false,
  }),
  [PLAYER_STATUS]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  cdgAlpha: 0,
  cdgSize: 0.7,
  errorMessage: '',
  historyJSON: '[]', // queueIds (JSON string is hack to pass selector equality check on clients)
  isAtQueueEnd: false,
  isErrored: false,
  isFetching: false,
  isPlaying: false,
  isPlayingNext: false,
  position: 0,
  queueId: -1,
  rgTrackGain: null,
  rgTrackPeak: null,
  volume: 1,
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
