import { createAction, createReducer } from '@reduxjs/toolkit'
import { type State as PlayerVisualizerState } from 'routes/Player/modules/playerVisualizer'
import {
  PLAYER_REQ_OPTIONS,
  PLAYER_REQ_PLAY,
  PLAYER_REQ_PAUSE,
  PLAYER_REQ_NEXT,
  PLAYER_REQ_VOLUME,
  PLAYER_STATUS,
  PLAYER_LEAVE,
} from 'shared/actionTypes'
import { MediaType, PlaybackOptions } from 'shared/types'

// ------------------------------------
// Actions
// ------------------------------------
export const requestPlay = createAction(PLAYER_REQ_PLAY)
export const requestPause = createAction(PLAYER_REQ_PAUSE)
export const requestPlayNext = createAction(PLAYER_REQ_NEXT)

export const requestVolume = createAction(PLAYER_REQ_VOLUME, (vol: number) => ({
  payload: vol,
  meta: {
    throttle: {
      wait: 200,
      leading: false,
    },
  },
}))

export const requestOptions = createAction(PLAYER_REQ_OPTIONS, (opts: PlaybackOptions) => ({
  payload: opts,
  meta: {
    throttle: {
      wait: 200,
      leading: true,
    },
  },
}))

// ------------------------------------
// Reducer
// ------------------------------------
interface statusState {
  cdgAlpha: number
  cdgSize: number
  errorMessage: string
  historyJSON: string // queueIds in JSON array
  isAtQueueEnd: boolean
  isErrored: boolean
  isPlayerPresent: boolean
  isPlaying: boolean
  isVideoKeyingEnabled: boolean
  isWebGLSupported: boolean
  mediaType: MediaType | null
  mp4Alpha: number
  nextUserId: number | null
  position: number
  queueId: number
  visualizer: PlayerVisualizerState | Record<string, never>
  volume: number
}

const initialState: statusState = {
  cdgAlpha: 0,
  cdgSize: 0.8,
  errorMessage: '',
  historyJSON: '[]', // queueIds in JSON array
  isAtQueueEnd: false,
  isErrored: false,
  isPlayerPresent: false,
  isPlaying: false,
  isVideoKeyingEnabled: false,
  isWebGLSupported: false,
  mediaType: null,
  mp4Alpha: 1,
  nextUserId: null,
  position: 0,
  queueId: -1,
  visualizer: {},
  volume: 1,
}

const statusReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(PLAYER_LEAVE, (state) => {
      state.isPlayerPresent = false
    })
    .addCase(PLAYER_STATUS, (state, { payload }) => ({
      ...state,
      ...payload,
      isPlayerPresent: true,
    }))
})

export default statusReducer
