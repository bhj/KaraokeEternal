import { CANCEL } from 'redux-throttle'
import getWebGLSupport from 'lib/getWebGLSupport'
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
  PLAYER_UPDATE,
} from 'shared/actionTypes'

// ------------------------------------
// Actions triggered by media events
// ------------------------------------
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
export function playerStatus (status = {}, deferEmit = false) {
  return (dispatch, getState) => {
    dispatch({
      type: PLAYER_UPDATE,
      payload: status,
    })

    const { player, playerVisualizer, playerRemoteControlQR } = getState()

    dispatch({
      type: PLAYER_EMIT_STATUS,
      payload: {
        cdgAlpha: player.cdgAlpha,
        cdgSize: player.cdgSize,
        errorMessage: player.errorMessage,
        historyJSON: player.historyJSON,
        isAtQueueEnd: player.isAtQueueEnd,
        isErrored: player.isErrored,
        isPlaying: player.isPlaying,
        isWebGLSupported: player.isWebGLSupported,
        mediaType: player.mediaType,
        mp4Alpha: player.mp4Alpha,
        nextUserId: player.nextUserId,
        position: player.position,
        queueId: player.queueId,
        volume: player.volume,
        visualizer: playerVisualizer,
        remoteControlQR: playerRemoteControlQR,
      },
      meta: {
        throttle: {
          wait: 1000,
          leading: !deferEmit,
        }
      }
    })
  }
}

// cancel any throttled/queued status emits
export function playerStatusCancel () {
  return {
    type: CANCEL,
    payload: {
      type: PLAYER_EMIT_STATUS,
    }
  }
}

export function playerLeave () {
  return (dispatch, getState) => {
    dispatch(playerStatusCancel())
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
    mp4Alpha: typeof payload.mp4Alpha === 'number' ? payload.mp4Alpha : state.mp4Alpha,
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
  [PLAYER_UPDATE]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  cdgAlpha: 0.5,
  cdgSize: 0.8,
  errorMessage: '',
  historyJSON: '[]', // queueIds (JSON string is hack to pass selector equality check on clients)
  isAtQueueEnd: false,
  isErrored: false,
  isFetching: false,
  isPlaying: false,
  isPlayingNext: false,
  isWebGLSupported: getWebGLSupport(),
  mediaType: null,
  mp4Alpha: 1,
  nextUserId: null,
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
