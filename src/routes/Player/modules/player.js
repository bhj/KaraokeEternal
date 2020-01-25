import { CANCEL } from 'redux-throttle'
import {
  PLAYER_BG_ALPHA,
  PLAYER_ERROR,
  PLAYER_QUEUE_LOAD,
  PLAYER_LEAVE_REQUEST,
  PLAYER_MEDIA_ELEMENT_CHANGE,
  PLAYER_MEDIA_REQUEST,
  PLAYER_MEDIA_REQUEST_SUCCESS,
  PLAYER_MEDIA_REQUEST_ERROR,
  PLAYER_NEXT,
  PLAYER_PAUSE,
  PLAYER_PLAY,
  PLAYER_QUEUE_END,
  PLAYER_STATUS_REQUEST,
  PLAYER_VOLUME,
} from 'shared/actionTypes'

// have server emit player status to room
export function emitStatus (status) {
  return (dispatch, getState) => {
    const player = getState().player
    const visualizer = getState().playerVisualizer

    dispatch({
      type: PLAYER_STATUS_REQUEST,
      payload: {
        alpha: player.alpha,
        isAlphaSupported: player.isAlphaSupported,
        errorMessage: player.errorMessage,
        // string primitive is a hack to pass selector equality check on client side
        historyJSON: JSON.stringify(player.history),
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

// sets new queueId and adds previous to history
export function loadQueueItem (queueId) {
  return {
    type: PLAYER_QUEUE_LOAD,
    payload: {
      queueId,
    }
  }
}

export function mediaElementChange (payload) {
  return {
    type: PLAYER_MEDIA_ELEMENT_CHANGE,
    payload,
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
  [PLAYER_BG_ALPHA]: (state, { payload }) => ({
    ...state,
    alpha: payload,
  }),
  [PLAYER_ERROR]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
    isErrored: true,
    errorMessage: payload.message,
  }),
  [PLAYER_MEDIA_ELEMENT_CHANGE]: (state, { payload }) => ({
    ...state,
    isAlphaSupported: payload.isAlphaSupported,
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
    lastCommandAt: Date.now(),
  }),
  [PLAYER_PAUSE]: (state, { payload }) => ({
    ...state,
    isPlaying: false,
    lastCommandAt: Date.now(),
  }),
  [PLAYER_PLAY]: (state, { payload }) => ({
    ...state,
    isErrored: false,
    isPlaying: true,
    lastCommandAt: Date.now(),
  }),
  [PLAYER_QUEUE_END]: (state, { payload }) => ({
    ...state,
    isAtQueueEnd: true,
    isPlayingNext: false,
  }),
  [PLAYER_QUEUE_LOAD]: (state, { payload }) => {
    const history = state.history.slice()

    // save previous
    if (state.queueId !== -1) {
      history.push(state.queueId)
    }

    return {
      ...state,
      history,
      isAtQueueEnd: false,
      isPlayingNext: false,
      queueId: payload.queueId,
    }
  },
  [PLAYER_STATUS_REQUEST]: (state, { payload }) => ({
    ...state,
    position: payload.position,
  }),
  [PLAYER_VOLUME]: (state, { payload }) => ({
    ...state,
    volume: payload,
    lastCommandAt: Date.now(),
  }),
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  alpha: 0.5,
  errorMessage: '',
  history: [], // queueIds
  isAtQueueEnd: false,
  isAlphaSupported: false,
  isErrored: false,
  isFetching: false,
  isPlaying: false,
  isPlayingNext: false,
  lastCommandAt: null,
  position: 0,
  queueId: -1,
  volume: 1,
}

export default function playerReducer (state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
