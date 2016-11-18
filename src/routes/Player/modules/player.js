import { ensureState } from 'redux-optimistic-ui'
import { CANCEL, FLUSH } from "redux-throttle"

const PLAYER_PLAY_REQUEST = 'server/PLAYER_PLAY'
const PLAYER_PLAY = 'player/PLAYER_PLAY'
const PLAYER_PAUSE_REQUEST = 'server/PLAYER_PAUSE'
const PLAYER_PAUSE = 'player/PLAYER_PAUSE'
const PLAYER_VOLUME_REQUEST = 'server/PLAYER_VOLUME'
const PLAYER_VOLUME = 'player/PLAYER_VOLUME'
const PLAYER_NEXT_REQUEST = 'server/PLAYER_NEXT'
const PLAYER_NEXT = 'player/PLAYER_NEXT'
const PLAYER_QUEUE_END = 'player/PLAYER_QUEUE_END'
const PLAYER_MEDIA_ERROR = 'player/PLAYER_MEDIA_ERROR'
const PLAYER_EMIT_STATUS = 'server/PLAYER_EMIT_STATUS'
const PLAYER_STATUS = 'player/PLAYER_STATUS'

// for informational purposes from provider players
export const GET_MEDIA = 'player/GET_MEDIA'
export const GET_MEDIA_SUCCESS = 'player/GET_MEDIA_SUCCESS'

// Request Play
export function requestPlay() {
  return {
    type: PLAYER_PLAY_REQUEST,
    payload: null
  }
}

// Request Pause
export function requestPause() {
  return {
    type: PLAYER_PAUSE_REQUEST,
    payload: null
  }
}

// Request Pause
export function requestVolume(vol) {
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

// Request Play Next
export function requestPlayNext() {
  return (dispatch, getState) => {
    dispatch({
      type: PLAYER_NEXT_REQUEST,
      payload: ensureState(getState()).player.queueId
    })
  }
}

export function cancelStatus() {
  return {
    type: CANCEL,
    payload: {type: PLAYER_EMIT_STATUS}
  }
}

export function getMedia(url) {
  return {
    type: GET_MEDIA,
    payload: url
  }
}

export function getMediaSuccess() {
  return {
    type: GET_MEDIA_SUCCESS,
    payload: null
  }
}

const PLAYER_EMIT_MEDIA_ERROR = 'server/PLAYER_EMIT_MEDIA_ERROR'
export function mediaError(queueId, message) {
  return {
    type: PLAYER_EMIT_MEDIA_ERROR,
    payload: { queueId, message }
  }
}

// have server emit player status to room
export function emitStatus(payload) {
  return {
    type: PLAYER_EMIT_STATUS,
    payload,
    meta: {throttle: true}
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_PAUSE]: (state, {payload}) => ({
    ...state,
    isPlaying: false,
  }),
  [PLAYER_PLAY]: (state, {payload}) => ({
    ...state,
    isPlaying: true,
  }),
  [PLAYER_VOLUME]: (state, {payload}) => ({
    ...state,
    volume: payload,
  }),
  [PLAYER_NEXT]: (state, {payload}) => {
    return {
      ...state,
      queueId: payload,
      position: 0,
      isAtQueueEnd: false,
      prevQueueId: state.queueId,
    }
  },
  [PLAYER_QUEUE_END]: (state, {payload}) => ({
    ...state,
    isPlaying: false,
    isAtQueueEnd: true,
  }),
  [GET_MEDIA]: (state, {payload}) => ({
    ...state,
    isFetching: true,
  }),
  [GET_MEDIA_SUCCESS]: (state, {payload}) => ({
    ...state,
    isFetching: false,
    isPlaying: true, // all media is loaded
  }),
  [PLAYER_EMIT_MEDIA_ERROR]: (state, {payload}) => ({
    ...state,
    isPlaying: false,
    isFetching: false,
  }),
  [PLAYER_STATUS]: (state, {payload}) => {
    if (state.prevQueueId === payload.queueId) {
      // ignore this (old) status update once
      return {
        ...state,
        prevQueueId: null,
      }
    }

    return {
      ...state,
      queueId: payload.queueId,
      position: payload.position,
      volume: payload.volume,
      isPlaying: payload.isPlaying,
      prevQueueId: null,
    }
  },
  [PLAYER_MEDIA_ERROR]: (state, {payload}) => {
    const {queueId, message} = payload

    return {
      ...state,
      errors: {
        ...state.errors,
        // can be multiple errors for a media item
        [queueId]: state.errors[queueId] ? state.errors[queueId].concat(message) : [message]
      }
    }
  },
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  queueId: -1,
  prevQueueId: null,
  position: 0,
  volume: 1,
  isPlaying: false,
  isFetching: false,
  isAtQueueEnd: false,
  errors: {},   // object of arrays keyed by queueId
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
