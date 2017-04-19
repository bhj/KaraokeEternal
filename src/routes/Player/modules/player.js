import { CANCEL } from 'redux-throttle'

import {
  PLAYER_NEXT_REQUEST,
  PLAYER_NEXT,
  PLAYER_PLAY_REQUEST,
  PLAYER_PLAY,
  PLAYER_PAUSE_REQUEST,
  PLAYER_PAUSE,
  PLAYER_VOLUME_REQUEST,
  PLAYER_VOLUME,
  PLAYER_QUEUE_END,
  EMIT_STATUS,
  EMIT_ERROR
} from 'constants'

// for informational purposes from provider players
export const GET_MEDIA = 'player/GET_MEDIA'
export const GET_MEDIA_SUCCESS = 'player/GET_MEDIA_SUCCESS'

// Request Play
export function requestPlay () {
  return {
    type: PLAYER_PLAY_REQUEST,
  }
}

// Request Pause
export function requestPause () {
  return {
    type: PLAYER_PAUSE_REQUEST,
  }
}

// Request volume
export function requestVolume (vol) {
  return {
    type: PLAYER_VOLUME_REQUEST,
    payload: vol,
    meta: {
      requireAck: false,
      throttle: {
        wait: 200,
        leading: false,
      }
    },
  }
}

// Request Play Next
export function requestPlayNext () {
  return (dispatch, getState) => {
    dispatch({
      type: PLAYER_NEXT_REQUEST,
      payload: getState().status.queueId
    })
  }
}

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
    const { queueId, isAtQueueEnd } = getState().player

    dispatch({
      type: EMIT_STATUS,
      payload: {
        ...status,
        queueId,
        isAtQueueEnd,
      },
      meta: {
        requireAck: false,
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
      type: EMIT_STATUS
    }
  }
}

// have server emit error to room
export function emitError (queueId, message) {
  return {
    type: EMIT_ERROR,
    payload: { queueId, message },
    meta: {
      requireAck: false,
    }
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_PAUSE]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
  }),
  [PLAYER_PLAY]: (state, { payload }) => ({
    ...state,
    isPlaying: true,
    lastRequestID: payload.requestID,
  }),
  [PLAYER_VOLUME]: (state, { payload }) => ({
    ...state,
    volume: payload,
  }),
  [PLAYER_NEXT]: (state, { payload }) => {
    return {
      ...state,
      queueId: payload,
      isPlaying: true,
      isAtQueueEnd: false,
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
    isPlaying: true, // all media is loaded
  }),
  [EMIT_ERROR]: (state, { payload }) => ({
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
  lastRequestID: null,
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
