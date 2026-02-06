import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { type PlayerVisualizerState } from 'routes/Player/modules/playerVisualizer'
import { type FftPayload } from 'shared/fftPayload'
import {
  PLAYER_CMD_OPTIONS,
  PLAYER_REQ_NEXT,
  PLAYER_REQ_OPTIONS,
  PLAYER_REQ_PLAY,
  PLAYER_REQ_PAUSE,
  PLAYER_REQ_REPLAY,
  PLAYER_REQ_VOLUME,
  PLAYER_STATUS,
  PLAYER_FFT,
  PLAYER_FRAME,
  PLAYER_LEAVE,
} from 'shared/actionTypes'
import { MediaType, PlaybackOptions } from 'shared/types'

export interface StatusState {
  cdgAlpha: number
  cdgSize: number
  errorMessage: string
  fftData: FftPayload | null
  frameDataUrl: string | null
  frameTimestamp: number | null
  historyJSON: string
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
  visualizer: Partial<PlayerVisualizerState>
  volume: number
}

const initialState: StatusState = {
  cdgAlpha: 0,
  cdgSize: 0.8,
  errorMessage: '',
  fftData: null,
  frameDataUrl: null,
  frameTimestamp: null,
  historyJSON: '[]',
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

const playerLeaveInternal = createAction(PLAYER_LEAVE)
const playerStatusInternal = createAction<Partial<StatusState>>(PLAYER_STATUS)
const playerFftInternal = createAction<FftPayload>(PLAYER_FFT)
const playerFrameInternal = createAction<{ dataUrl: string, timestamp: number }>(PLAYER_FRAME)
const playerCmdOptionsInternal = createAction<{ visualizer?: Partial<PlayerVisualizerState> }>(PLAYER_CMD_OPTIONS)

const statusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(playerLeaveInternal, (state) => {
        state.isPlayerPresent = false
        state.fftData = null
        state.frameDataUrl = null
        state.frameTimestamp = null
      })
      .addCase(playerStatusInternal, (state, action: PayloadAction<Partial<StatusState>>) => ({
        ...state,
        ...action.payload,
        isPlayerPresent: true,
      }))
      .addCase(playerFftInternal, (state, action: PayloadAction<FftPayload>) => {
        state.fftData = action.payload
      })
      .addCase(playerFrameInternal, (state, action: PayloadAction<{ dataUrl: string, timestamp: number }>) => {
        state.frameDataUrl = action.payload.dataUrl
        state.frameTimestamp = action.payload.timestamp
      })
      .addCase(
        playerCmdOptionsInternal,
        (state, action: PayloadAction<{ visualizer?: Partial<PlayerVisualizerState> }>) => {
          const { payload } = action
          if (payload.visualizer && typeof payload.visualizer === 'object') {
            state.visualizer = { ...state.visualizer, ...payload.visualizer }
          }
        },
      )
  },
})

export const requestPlay = createAction(PLAYER_REQ_PLAY)
export const requestPause = createAction(PLAYER_REQ_PAUSE)
export const requestPlayNext = createAction(PLAYER_REQ_NEXT)

export const requestReplay = createAction(PLAYER_REQ_REPLAY, (queueId: number) => ({
  payload: { queueId },
}))

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
    isOptimistic: true,
    throttle: {
      wait: 200,
      leading: true,
    },
  },
}))

export default statusSlice.reducer
