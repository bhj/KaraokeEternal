import { CANCEL } from 'redux-throttle'
import {
  PLAYER_ERROR,
  PLAYER_LEAVE_REQUEST,
  PLAYER_MEDIA_REQUEST,
  PLAYER_MEDIA_REQUEST_SUCCESS,
  PLAYER_MEDIA_REQUEST_ERROR,
  PLAYER_NEXT,
  PLAYER_PAUSE,
  PLAYER_PLAY,
  PLAYER_QUEUE_LOAD,
  PLAYER_QUEUE_END,
  PLAYER_STATUS_REQUEST,
  PLAYER_VOLUME,
} from 'shared/actionTypes'

// have server emit player status to room
export function emitStatus (status, cancelPrev = false) {
  return (dispatch, getState) => {
    if (cancelPrev) {
      dispatch(cancelStatus())
    }

    dispatch({
      type: PLAYER_STATUS_REQUEST,
      payload: {
        ...getState().player,
        ...status,
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

// sets new queueId and adds previous to history
export function loadQueueItem (queueItem) {
  return {
    type: PLAYER_QUEUE_LOAD,
    payload: queueItem,
  }
}

export function mediaRequest (meta) {
  return {
    type: PLAYER_MEDIA_REQUEST,
    payload: meta,
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

export function queueEnd () {
  return {
    type: PLAYER_QUEUE_END,
  }
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [PLAYER_ERROR]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
    isErrored: true,
    errorMessage: payload.message,
  }),
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
  [PLAYER_NEXT]: (state, { payload }) => ({
    ...state,
    isErrored: false,
    isPlaying: true,
    isPlayingNext: true,
  }),
  [PLAYER_PAUSE]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
  }),
  [PLAYER_PLAY]: (state, { payload }) => ({
    ...state,
    isErrored: false,
    isPlaying: true,
  }),
  [PLAYER_QUEUE_END]: (state, { payload }) => ({
    ...state,
    isAtQueueEnd: true,
    isPlayingNext: false,
  }),
  [PLAYER_QUEUE_LOAD]: (state, { payload }) => {
    const history = JSON.parse(state.historyJSON)

    // save previous
    if (state.queueId !== -1) {
      history.push(state.queueId)
    }

    return {
      ...state,
      historyJSON: JSON.stringify(history),
      isAtQueueEnd: false,
      isPlayingNext: false,
      queueId: payload.queueId,
      rgTrackGain: payload.rgTrackGain,
      rgTrackPeak: payload.rgTrackPeak,
    }
  },
  [PLAYER_STATUS_REQUEST]: (state, { payload }) => ({
    ...state,
    ...payload,
  }),
  [PLAYER_VOLUME]: (state, { payload }) => ({
    ...state,
    volume: payload,
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  alpha: 0.5,
  errorMessage: '',
  historyJSON: '[]', // queueIds (JSON string is hack to pass selector equality check on clients)
  isAtQueueEnd: false,
  isAlphaSupported: false,
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
