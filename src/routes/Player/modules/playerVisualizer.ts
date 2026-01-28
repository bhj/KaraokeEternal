import { createAction, createReducer } from '@reduxjs/toolkit'
import presets from 'butterchurn-presets/all'
import {
  PLAYER_CMD_OPTIONS,
  PLAYER_LOAD,
  PLAYER_VISUALIZER_ERROR,
} from 'shared/actionTypes'
import type { ColorPalette, LyricsMode, PlaybackOptions, VisualizerMode } from 'shared/types'

const BAD_PRESETS = [
  'Flexi + Martin - astral projection',
  'Rovastar & Loadus + Zylot - FractalDrop (Spark Machine v2.0)',
]

const _presetKeys = Object.keys(presets).filter(key => !BAD_PRESETS.includes(key))

const getPreset = (i: number) => ({
  presetKey: _presetKeys[i],
  presetName: `[${i + 1}/${_presetKeys.length}] ` + _presetKeys[i],
})

const getRandomPreset = () => getPreset(Math.floor(Math.random() * (_presetKeys.length - 1)))

// ------------------------------------
// Actions
// ------------------------------------
const playerCmdOptions = createAction<{ visualizer: PlaybackOptions['visualizer'] }>(PLAYER_CMD_OPTIONS)
export const playerLoad = createAction(PLAYER_LOAD)
export const playerVisualizerError = createAction<string>(PLAYER_VISUALIZER_ERROR)

// ------------------------------------
// Reducer
// ------------------------------------
export interface PlayerVisualizerState {
  isEnabled: boolean
  isSupported: boolean
  presetKey: string
  presetName: string
  sensitivity: number
  // New visualizer state
  mode: VisualizerMode
  colorPalette: ColorPalette
  lyricsMode: LyricsMode
}

const initialState: PlayerVisualizerState = {
  isEnabled: true,
  isSupported: true,
  ...getRandomPreset(),
  sensitivity: 1,
  // New defaults
  mode: 'particles',
  colorPalette: 'warm',
  lyricsMode: 'cdgOnly',
}

const playerVisualizerReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(playerLoad, state => ({
      ...state,
      ...getRandomPreset(),
    }))
    .addCase(playerCmdOptions, (state, { payload }) => {
      const { visualizer } = payload
      if (typeof visualizer !== 'object') return state

      let preset = {}

      if (visualizer.nextPreset || visualizer.prevPreset) {
        const curIdx = _presetKeys.indexOf(state.presetKey)
        const nextIdx = curIdx === _presetKeys.length - 1 ? 0 : curIdx + 1 // wrap around
        const prevIdx = curIdx === 0 ? _presetKeys.length - 1 : curIdx - 1 // wrap around

        preset = getPreset(visualizer.nextPreset ? nextIdx : visualizer.prevPreset ? prevIdx : curIdx)
      } else if (visualizer.randomPreset) {
        preset = getRandomPreset()
      }

      return {
        ...state,
        ...preset,
        isEnabled: typeof visualizer.isEnabled === 'boolean' ? visualizer.isEnabled : state.isEnabled,
        sensitivity: typeof visualizer.sensitivity === 'number' ? visualizer.sensitivity : state.sensitivity,
        // New visualizer options
        mode: visualizer.mode ?? state.mode,
        colorPalette: visualizer.colorPalette ?? state.colorPalette,
        lyricsMode: visualizer.lyricsMode ?? state.lyricsMode,
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
