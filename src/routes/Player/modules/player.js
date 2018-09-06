import { CANCEL } from 'redux-throttle'
import {
  PLAYER_MEDIA_REQUEST,
  PLAYER_MEDIA_REQUEST_SUCCESS,
  PLAYER_MEDIA_REQUEST_ERROR,
  PLAYER_PLAY,
  PLAYER_PAUSE,
  PLAYER_NEXT,
  PLAYER_VOLUME,
  EMIT_PLAYER_STATUS,
  EMIT_PLAYER_ERROR,
  EMIT_PLAYER_LEAVE,
  QUEUE_PUSH,
} from 'shared/actions'

// have server emit player status to room
export function emitStatus (status) {
  return (dispatch, getState) => {
    const player = getState().player

    dispatch({
      type: EMIT_PLAYER_STATUS,
      payload: {
        queueId: player.queueId,
        isPlaying: player.isPlaying,
        isAtQueueEnd: player.isAtQueueEnd,
        volume: player.volume,
        ...status,
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
      type: EMIT_PLAYER_ERROR,
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
    type: EMIT_PLAYER_LEAVE,
  }
}

// cancel any pending status emits
export function cancelStatus () {
  return {
    type: CANCEL,
    payload: {
      type: EMIT_PLAYER_STATUS
    }
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
  [EMIT_PLAYER_ERROR]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  queueId: -1,
  volume: 1,
  isPlaying: false,
  isFetching: false,
  isAtQueueEnd: false,
  lastCommandAt: null,
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
