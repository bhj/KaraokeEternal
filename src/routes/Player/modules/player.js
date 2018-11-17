import { CANCEL } from 'redux-throttle'
import {
  PLAYER_MEDIA_CHANGE,
  PLAYER_MEDIA_REQUEST,
  PLAYER_MEDIA_REQUEST_SUCCESS,
  PLAYER_MEDIA_REQUEST_ERROR,
  PLAYER_BG_ALPHA,
  PLAYER_PLAY,
  PLAYER_PAUSE,
  PLAYER_NEXT,
  PLAYER_VOLUME,
  PLAYER_STATUS_REQUEST,
  PLAYER_ERROR_REQUEST,
  PLAYER_LEAVE_REQUEST,
  QUEUE_PUSH,
} from 'shared/actions'

// have server emit player status to room
export function emitStatus (overrides) {
  return (dispatch, getState) => {
    const player = getState().player
    const visualizer = getState().playerVisualizer

    dispatch({
      type: PLAYER_STATUS_REQUEST,
      payload: {
        bgAlpha: player.bgAlpha,
        queueId: player.queueId,
        isPlaying: player.isPlaying,
        isAtQueueEnd: player.isAtQueueEnd,
        visualizer,
        volume: player.volume,
        ...overrides,
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

// emit error to room and stop playback
export function emitError (msg) {
  return (dispatch, getState) => {
    dispatch({
      type: PLAYER_ERROR_REQUEST,
      payload: {
        queueId: getState().player.queueId,
        msg,
      },
    })
  }
}

// player left room
export function emitLeave () {
  return {
    type: PLAYER_LEAVE_REQUEST,
  }
}

// cancel any pending status emits
export function cancelStatus () {
  return {
    type: CANCEL,
    payload: {
      type: PLAYER_STATUS_REQUEST
    }
  }
}

export function mediaChange (payload) {
  return {
    type: PLAYER_MEDIA_CHANGE,
    payload,
  }
}

export function mediaRequest () {
  return {
    type: PLAYER_MEDIA_REQUEST,
  }
}

export function mediaRequestSuccess () {
  return {
    type: PLAYER_MEDIA_REQUEST_SUCCESS,
  }
}

export function mediaRequestError (msg) {
  return (dispatch, getState) => {
    dispatch({
      type: PLAYER_MEDIA_REQUEST_ERROR,
    })

    // emit generic error and stop playback
    emitError(msg)
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_BG_ALPHA]: (state, { payload }) => ({
    ...state,
    bgAlpha: payload,
  }),
  [PLAYER_PAUSE]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
    lastCommandAt: Date.now(),
  }),
  [PLAYER_PLAY]: (state, { payload }) => ({
    ...state,
    isPlaying: true,
    lastCommandAt: Date.now(),
  }),
  [PLAYER_VOLUME]: (state, { payload }) => ({
    ...state,
    volume: payload,
    lastCommandAt: Date.now(),
  }),
  [PLAYER_NEXT]: (state, { payload }) => {
    const curIdx = payload.result.indexOf(state.queueId)
    const isAtQueueEnd = curIdx === payload.result.length - 1

    return {
      ...state,
      queueId: isAtQueueEnd ? state.queueId : payload.result[curIdx + 1],
      isPlaying: true,
      isAtQueueEnd,
    }
  },
  [QUEUE_PUSH]: (state, { payload }) => {
    const curIdx = payload.result.indexOf(state.queueId)
    const isAtQueueEnd = curIdx === payload.result.length - 1

    return {
      ...state,
      // if we're no longer out of songs, play next
      queueId: (state.isAtQueueEnd && !isAtQueueEnd) ? payload.result[curIdx + 1] : state.queueId,
      // this should only flip from true -> false here, otherwise playback will stop
      isAtQueueEnd: (state.isAtQueueEnd && !isAtQueueEnd) ? false : state.isAtQueueEnd,
    }
  },
  [PLAYER_MEDIA_REQUEST]: (state, { payload }) => ({
    ...state,
    isFetching: true,
  }),
  [PLAYER_MEDIA_REQUEST_SUCCESS]: (state, { payload }) => ({
    ...state,
    isFetching: false,
  }),
  [PLAYER_MEDIA_REQUEST_ERROR]: (state, { payload }) => ({
    ...state,
    isFetching: false,
  }),
  [PLAYER_ERROR_REQUEST]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  bgAlpha: 0.5,
  queueId: -1,
  isPlaying: false,
  isFetching: false,
  isAtQueueEnd: false,
  lastCommandAt: null,
  volume: 1,
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
