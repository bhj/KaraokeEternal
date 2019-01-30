import { CANCEL } from 'redux-throttle'
import {
  PLAYER_MEDIA_ELEMENT_CHANGE,
  PLAYER_MEDIA_REQUEST,
  PLAYER_MEDIA_REQUEST_SUCCESS,
  PLAYER_MEDIA_REQUEST_ERROR,
  PLAYER_BG_ALPHA,
  PLAYER_PLAY,
  PLAYER_PAUSE,
  PLAYER_NEXT,
  PLAYER_VOLUME,
  PLAYER_STATUS_REQUEST,
  PLAYER_ERROR,
  PLAYER_LEAVE_REQUEST,
  QUEUE_PUSH,
} from 'shared/actionTypes'

// have server emit player status to room
export function emitStatus (status) {
  return (dispatch, getState) => {
    const player = getState().player
    const visualizer = getState().playerVisualizer

    dispatch({
      type: PLAYER_STATUS_REQUEST,
      payload: {
        bgAlpha: player.bgAlpha,
        errorMessage: player.errorMessage,
        isAtQueueEnd: player.isAtQueueEnd,
        isErrored: player.isErrored,
        isPlaying: player.isPlaying,
        position: player.position,
        queueId: player.queueId,
        volume: player.volume,
        visualizer,
        ...status, // may have current position, etc.
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

// generic player error
export function playerError (message) {
  return {
    type: PLAYER_ERROR,
    payload: { message },
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

export function mediaElementChange (payload) {
  return {
    type: PLAYER_MEDIA_ELEMENT_CHANGE,
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

export function mediaRequestError (message) {
  return (dispatch, getState) => {
    dispatch({
      type: PLAYER_MEDIA_REQUEST_ERROR,
      payload: { message }
    })

    // generic error action (stops playback)
    dispatch(playerError(message))
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
  [PLAYER_ERROR]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
    isErrored: true,
    errorMessage: payload.message,
  }),
  [PLAYER_MEDIA_REQUEST]: (state, { payload }) => ({
    ...state,
    isFetching: true,
    isErrored: false,
  }),
  [PLAYER_MEDIA_REQUEST_SUCCESS]: (state, { payload }) => ({
    ...state,
    isFetching: false,
  }),
  [PLAYER_MEDIA_REQUEST_ERROR]: (state, { payload }) => ({
    ...state,
    isFetching: false,
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
  [PLAYER_STATUS_REQUEST]: (state, { payload }) => ({
    ...state,
    position: payload.position,
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
      position: 0,
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
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  bgAlpha: 0.5,
  errorMessage: '',
  isAtQueueEnd: false,
  isErrored: false,
  isFetching: false,
  isPlaying: false,
  lastCommandAt: null,
  position: 0,
  queueId: -1,
  volume: 1,
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
