import { createAction, createReducer } from '@reduxjs/toolkit'
import { ensureState } from 'redux-optimistic-ui'
import { AppThunk } from 'store/store'
import { CANCEL } from 'redux-throttle'
import getWebGLSupport from 'lib/getWebGLSupport'
import { pitchShifterEngine } from 'lib/pitchShifter'
import { PITCH_SEMITONES_MAX, PITCH_SEMITONES_MIN } from 'shared/types'
import {
  PLAYER_CMD_NEXT,
  PLAYER_CMD_OPTIONS,
  PLAYER_CMD_PAUSE,
  PLAYER_CMD_PLAY,
  PLAYER_CMD_REPLAY,
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

// triggered by media events
export const playerError = createAction<string>(PLAYER_ERROR)
export const playerLoad = createAction<{ queueId: number, pitch: number }>(PLAYER_LOAD)
export const playerPlay = createAction(PLAYER_PLAY)
export const playerCmdNext = createAction(PLAYER_CMD_NEXT)

// triggered by clients
const playerCmdPause = createAction(PLAYER_CMD_PAUSE)
const playerCmdPlay = createAction(PLAYER_CMD_PLAY)
const playerCmdReplay = createAction<{ queueId: number }>(PLAYER_CMD_REPLAY)
const playerCmdVolume = createAction<number>(PLAYER_CMD_VOLUME)
const playerCmdOptions = createAction<{
  cdgAlpha: number
  cdgSize: number
  mp4Alpha: number
  pitch: number
}>(PLAYER_CMD_OPTIONS)

// ------------------------------------
// Actions for emitting to room
// ------------------------------------
/**
 * isImmediate skips the throttle's wait, which during playback is nearly always
 * running because position updates arrive several times a second. Cancelling the
 * pending emit first is what makes this safe: it can only hold an older snapshot
 * than the one sent now, and a second unthrottled path would let it go out after.
 */
export function playerStatus (status: Partial<PlayerState> = {}, isImmediate = false): AppThunk {
  return (dispatch, getState) => {
    const { player, playerVisualizer } = getState()

    // update "internal" state (player slice); status is partial
    dispatch(playerUpdate(status))

    // emit full updated status (excluding "private" properties)
    const emitStatus = Object.fromEntries(
      Object.entries({
        ...player, // previous complete state
        ...status, // current partial state
      }).filter(([key]) => !key.startsWith('_')),
    )

    if (isImmediate) dispatch(playerStatusCancel())

    dispatch({
      type: PLAYER_EMIT_STATUS,
      payload: {
        ...emitStatus,
        visualizer: playerVisualizer,
      },
      meta: {
        // redux-throttle keeps the options from the first action of this type,
        // so these can't vary per call
        throttle: {
          wait: 1000,
          leading: true,
        },
      },
    })
  }
}

/**
 * Apply the stored pitch for the item being loaded: the singer's own preference
 * for the media if they've saved one, else the media's default. Derived here
 * rather than passed in so both callers agree, and so neither has to take the
 * queue as a dependency (see useMediaSource).
 */
export function playerLoadCurrent (): AppThunk {
  return (dispatch, getState) => {
    const { player, queue } = getState()
    const queueItem = ensureState(queue).entities[player.queueId]

    dispatch(playerLoad({
      queueId: player.queueId,
      pitch: queueItem && queueItem.isOptimistic !== true
        ? queueItem.userPitch ?? queueItem.pitch ?? 0
        : 0,
    }))
  }
}

// cancel any throttled/queued status emits
export function playerStatusCancel () {
  return {
    type: CANCEL,
    payload: {
      type: PLAYER_EMIT_STATUS,
    },
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
export interface PlayerState {
  cdgAlpha: number
  cdgSize: number
  errorMessage: string
  historyJSON: string
  isAtQueueEnd: boolean
  isErrored: boolean
  isPitchSupported: boolean
  isPlaying: boolean
  isVideoKeyingEnabled: boolean
  isWebGLSupported: boolean
  mediaType: string | null
  mp4Alpha: number
  nextUserId: number | null
  pitch: number
  position: number
  queueId: number
  rgTrackGain: number | null
  rgTrackPeak: number | null
  volume: number
  _isFetching: boolean
  _isPlayingNext: boolean
  _isReplayingQueueId: number | null
  _lastReplayTime: number
  _pitchLoadedForQueueId: number | null
}

const initialState: PlayerState = {
  cdgAlpha: 0.5,
  cdgSize: 0.65,
  errorMessage: '',
  historyJSON: '[]', // queueIds (JSON string is hack to pass selector equality check on clients)
  isAtQueueEnd: false,
  isErrored: false,
  isPitchSupported: pitchShifterEngine.isSupported(),
  isPlaying: false,
  isVideoKeyingEnabled: false,
  isWebGLSupported: getWebGLSupport(),
  mediaType: null,
  mp4Alpha: 0.5,
  nextUserId: null,
  pitch: 0,
  position: 0,
  queueId: -1,
  rgTrackGain: null,
  rgTrackPeak: null,
  volume: 1,
  // "private" internal state that shouldn't be emitted
  _isFetching: false,
  _isPlayingNext: false,
  _isReplayingQueueId: null,
  _lastReplayTime: 0,
  _pitchLoadedForQueueId: null,
}

const playerReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(playerCmdNext, (state) => {
      state._isPlayingNext = true
    })
    .addCase(playerCmdOptions, (state, { payload }) => ({
      ...state,
      cdgAlpha: typeof payload.cdgAlpha === 'number' ? payload.cdgAlpha : state.cdgAlpha,
      cdgSize: typeof payload.cdgSize === 'number' ? payload.cdgSize : state.cdgSize,
      mp4Alpha: typeof payload.mp4Alpha === 'number' ? payload.mp4Alpha : state.mp4Alpha,
      pitch: typeof payload.pitch === 'number' && Number.isFinite(payload.pitch)
        ? Math.max(PITCH_SEMITONES_MIN, Math.min(PITCH_SEMITONES_MAX, Math.round(payload.pitch)))
        : state.pitch,
    }))
    .addCase(playerCmdPause, (state) => {
      state.isPlaying = false
    })
    .addCase(playerCmdPlay, (state) => {
      state.isPlaying = true
    })
    .addCase(playerCmdReplay, (state, { payload }) => {
      state._isReplayingQueueId = payload.queueId
      state._lastReplayTime = Date.now()
    })
    .addCase(playerCmdVolume, (state, { payload }) => {
      state.volume = payload
    })
    .addCase(playerError, (state, { payload }) => ({
      ...state,
      errorMessage: payload,
      isErrored: true,
      isPlaying: false,
      _isFetching: false,
    }))
    .addCase(playerLoad, (state, { payload }) => ({
      ...state,
      errorMessage: '',
      isErrored: false,
      // a load fires again when mediaSrc resolves, which for media awaiting
      // ReplayGain analysis is up to a minute after the first one. Applying the
      // default only once per queue item means that second load can't discard a
      // pitch set while waiting.
      pitch: payload.queueId === state._pitchLoadedForQueueId
        ? state.pitch
        : (state.isPitchSupported ? payload.pitch : 0),
      _isFetching: true,
      _pitchLoadedForQueueId: payload.queueId,
    }))
    .addCase(playerPlay, (state) => {
      state._isFetching = false
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
