import { createAction, createReducer } from '@reduxjs/toolkit'
import {
  PLAYER_CMD_OPTIONS,
  PLAYER_LOAD,
  PLAYER_VISUALIZER_ERROR,
  VISUALIZER_HYDRA_CODE,
} from 'shared/actionTypes'
import type { AudioResponseState, PlaybackOptions, VisualizerMode } from 'shared/types'
import { AUDIO_RESPONSE_DEFAULTS } from 'shared/types'
import { getDefaultPreset, getDefaultPresetIndex, getPresetLabel } from 'routes/Orchestrator/components/hydraPresets'

// ------------------------------------
// Actions
// ------------------------------------
const playerCmdOptions = createAction<{ visualizer: PlaybackOptions['visualizer'] }>(PLAYER_CMD_OPTIONS)
const hydraCodeReceived = createAction<{ code: string, hydraPresetIndex?: number }>(VISUALIZER_HYDRA_CODE)
export const playerLoad = createAction(PLAYER_LOAD)
export const playerVisualizerError = createAction<string>(PLAYER_VISUALIZER_ERROR)

// ------------------------------------
// Reducer
// ------------------------------------
export interface PlayerVisualizerState {
  isEnabled: boolean
  isSupported: boolean
  sensitivity: number
  mode: VisualizerMode
  hydraCode?: string
  hydraPresetIndex: number
  hydraPresetName: string
  hasHydraUpdate: boolean
  audioResponse: AudioResponseState
  allowCamera: boolean
}

const _defaultHydraIndex = getDefaultPresetIndex()

const initialState: PlayerVisualizerState = {
  isEnabled: true,
  isSupported: true,
  sensitivity: 1,
  mode: 'hydra',
  hydraCode: getDefaultPreset(),
  hydraPresetIndex: _defaultHydraIndex,
  hydraPresetName: getPresetLabel(_defaultHydraIndex),
  hasHydraUpdate: false,
  audioResponse: { ...AUDIO_RESPONSE_DEFAULTS },
  allowCamera: false,
}

/** Guard: only allow valid modes */
function validMode (mode: VisualizerMode | undefined, fallback: VisualizerMode): VisualizerMode {
  if (mode === 'hydra' || mode === 'off') return mode
  return fallback
}

const playerVisualizerReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(playerLoad, state => ({
      ...state,
      hasHydraUpdate: false,
    }))
    .addCase(playerCmdOptions, (state, { payload }) => {
      const { visualizer } = payload
      if (typeof visualizer !== 'object') return state

      return {
        ...state,
        isEnabled: typeof visualizer.isEnabled === 'boolean' ? visualizer.isEnabled : state.isEnabled,
        sensitivity: typeof visualizer.sensitivity === 'number' ? visualizer.sensitivity : state.sensitivity,
        mode: validMode(visualizer.mode, state.mode),
        audioResponse: visualizer.audioResponse
          ? { ...AUDIO_RESPONSE_DEFAULTS, ...visualizer.audioResponse }
          : state.audioResponse,
        allowCamera: typeof visualizer.allowCamera === 'boolean' ? visualizer.allowCamera : state.allowCamera,
      }
    })
    .addCase(hydraCodeReceived, (state, { payload }) => {
      state.hydraCode = payload.code
      state.hasHydraUpdate = true
      // Server-chosen index: dispatching client includes hydraPresetIndex in payload.
      // Only update index/name when present (preset navigation).
      // Code-only payloads (Orchestrator send) preserve existing preset index.
      if (typeof payload.hydraPresetIndex === 'number') {
        state.hydraPresetIndex = payload.hydraPresetIndex
        state.hydraPresetName = getPresetLabel(payload.hydraPresetIndex)
      }
    })
    .addCase(playerVisualizerError, (state) => {
      state.isSupported = false
    })
})

export default playerVisualizerReducer

declare module 'store/reducers' {
  export interface LazyLoadedSlices {
    playerVisualizer: typeof initialState
  }
}
