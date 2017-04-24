import { CANCEL } from 'redux-throttle'

import {
  PLAYER_PLAY,
  PLAYER_PAUSE,
  PLAYER_NEXT,
  PLAYER_VOLUME,
  PLAYER_QUEUE_END,
  EMIT_PLAYER_STATUS,
  EMIT_PLAYER_ERROR,
  EMIT_PLAYER_LEAVE,
} from 'constants'

// for informational purposes from provider players
export const GET_MEDIA = 'player/GET_MEDIA'
export const GET_MEDIA_SUCCESS = 'player/GET_MEDIA_SUCCESS'

export function getMedia (url) {
  return {
    type: GET_MEDIA,
    payload: url
  }
}

export function getMediaSuccess () {
  return {
    type: GET_MEDIA_SUCCESS,
  }
}

// have server emit player status to room
export function emitStatus (status) {
  return (dispatch, getState) => {
    const player = getState().player

    dispatch({
      type: EMIT_PLAYER_STATUS,
      payload: {
        ...status,
        queueId: player.queueId,
        isAtQueueEnd: player.isAtQueueEnd,
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

// cancel pending status emits
export function cancelStatus () {
  return {
    type: CANCEL,
    payload: {
      type: EMIT_PLAYER_STATUS
    }
  }
}

// have server emit error to room
export function emitError (queueId, message) {
  return {
    type: EMIT_PLAYER_ERROR,
    payload: { queueId, message },
  }
}

export function emitLeave () {
  return {
    type: EMIT_PLAYER_LEAVE,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_PAUSE]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
    lastTimestamp: Date.now(),
  }),
  [PLAYER_PLAY]: (state, { payload }) => ({
    ...state,
    isPlaying: true,
    lastTimestamp: Date.now(),
  }),
  [PLAYER_VOLUME]: (state, { payload }) => ({
    ...state,
    volume: payload,
  }),
  [PLAYER_NEXT]: (state, { payload }) => {
    const curIdx = payload.result.indexOf(state.queueId)

    if (curIdx === payload.result.length - 1) {
      return {
        ...state,
        isAtQueueEnd: true,
      }
    }

    return {
      ...state,
      queueId: payload.result[curIdx + 1],
    }
  },
  [PLAYER_QUEUE_END]: (state, { payload }) => ({
    ...state,
    isAtQueueEnd: true,
  }),
  [GET_MEDIA]: (state, { payload }) => ({
    ...state,
    isFetching: true,
  }),
  [GET_MEDIA_SUCCESS]: (state, { payload }) => ({
    ...state,
    isFetching: false,
  }),
  [EMIT_PLAYER_ERROR]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
    isFetching: false,
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
  lastTimestamp: null,
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
