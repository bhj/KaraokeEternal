import { createAction, createReducer } from '@reduxjs/toolkit'
import { AppThunk } from 'store/store'
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
  REDUX_SLICE_INJECT_NOOP,
} from 'shared/actionTypes'

// internal use
export const playerUpdate = createAction<object>(PLAYER_UPDATE)

// ------------------------------------
// Actions triggered by media events
// ------------------------------------
export const playerError = createAction<string>(PLAYER_ERROR)
export const playerLoad = createAction(PLAYER_LOAD)
export const playerPlay = createAction(PLAYER_PLAY)

// ------------------------------------
// Actions for emitting to room
// ------------------------------------
export function playerStatus (status = {}, deferEmit = false): AppThunk {
  return (dispatch, getState) => {
    const { player, playerVisualizer } = getState()

    dispatch(playerUpdate(status))

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

export function playerLeave (): AppThunk {
  return (dispatch) => {
    dispatch(playerStatusCancel())
    dispatch({
      type: PLAYER_EMIT_LEAVE,
    })
  }
}

// ------------------------------------
// Reducer
// ------------------------------------
interface playerState {
  cdgAlpha: number
  cdgSize: number
  errorMessage: string
  historyJSON: string
  isAtQueueEnd: boolean
  isErrored: boolean
  isFetching: boolean
  isPlaying: boolean
  isPlayingNext: boolean
  isWebGLSupported: boolean
  mediaType: string | null
  mp4Alpha: number
  nextUserId: number | null
  position: number
  queueId: number
  rgTrackGain: number | null
  rgTrackPeak: number | null
  volume: number
}

const initialState: playerState = {
  cdgAlpha: 1,
  cdgSize: 1,
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

const playerReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(PLAYER_CMD_NEXT, (state) => {
      state.isPlayingNext = true
    })
    .addCase(PLAYER_CMD_OPTIONS, (state, { payload }) => ({
      ...state,
      cdgAlpha: typeof payload.cdgAlpha === 'number' ? payload.cdgAlpha : state.cdgAlpha,
      cdgSize: typeof payload.cdgSize === 'number' ? payload.cdgSize : state.cdgSize,
      mp4Alpha: typeof payload.mp4Alpha === 'number' ? payload.mp4Alpha : state.mp4Alpha,
    }))
    .addCase(PLAYER_CMD_PAUSE, (state) => {
      state.isPlaying = false
    })
    .addCase(PLAYER_CMD_PLAY, (state) => {
      state.isPlaying = true
    })
    .addCase(PLAYER_CMD_VOLUME, (state, { payload }) => {
      state.volume = payload
    })
    .addCase(playerError, (state, { payload }) => ({
      ...state,
      errorMessage: payload,
      isErrored: true,
      isFetching: false,
      isPlaying: false,
    }))
    .addCase(playerLoad, (state) => ({
      ...state,
      errorMessage: '',
      isErrored: false,
      isFetching: true,
    }))
    .addCase(playerPlay, (state) => {
      state.isFetching = false
    })
    .addCase(playerUpdate, (state, { payload }) => ({
      ...state,
      ...payload,
    }))
})

export default playerReducer

declare module 'store/reducers' {
  export interface LazyLoadedSlices {
    player: typeof initialState
  }
}

export const sliceInjectNoOp = createAction(REDUX_SLICE_INJECT_NOOP)
