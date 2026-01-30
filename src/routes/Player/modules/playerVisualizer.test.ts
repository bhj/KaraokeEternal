import { describe, it, expect } from 'vitest'
import { createReducer, createAction } from '@reduxjs/toolkit'
import {
  PLAYER_CMD_OPTIONS,
  PLAYER_LOAD,
  PLAYER_VISUALIZER_ERROR,
  VISUALIZER_HYDRA_CODE,
} from 'shared/actionTypes'

/**
 * Tests for the extended playerVisualizer module.
 * TDD: These tests define the expected behavior for visualizer features:
 * - Multiple visualizer modes (hydra, milkdrop)
 */

export type VisualizerMode
  = | 'hydra' // Hydra video synth
    | 'milkdrop' // Legacy Butterchurn (fallback)
    | 'off'

interface PlayerVisualizerState {
  isEnabled: boolean
  isSupported: boolean
  presetKey: string
  presetName: string
  sensitivity: number
  mode: VisualizerMode
}

const initialState: PlayerVisualizerState = {
  isEnabled: true,
  isSupported: true,
  presetKey: '',
  presetName: '',
  sensitivity: 1,
  mode: 'hydra',
}

interface ExtendedVisualizerOptions {
  sensitivity?: number
  isEnabled?: boolean
  nextPreset?: boolean
  prevPreset?: boolean
  randomPreset?: boolean
  mode?: VisualizerMode
}

// Create test actions
const playerCmdOptions = createAction<{ visualizer: ExtendedVisualizerOptions }>(PLAYER_CMD_OPTIONS)
const playerLoad = createAction(PLAYER_LOAD)
const playerVisualizerError = createAction<string>(PLAYER_VISUALIZER_ERROR)

// Expected reducer
const expectedReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(playerLoad, state => ({
      ...state,
      presetKey: 'randomPreset',
      presetName: '[1/100] randomPreset',
    }))
    .addCase(playerCmdOptions, (state, { payload }) => {
      const { visualizer } = payload
      if (typeof visualizer !== 'object') return state

      return {
        ...state,
        isEnabled: typeof visualizer.isEnabled === 'boolean' ? visualizer.isEnabled : state.isEnabled,
        sensitivity: typeof visualizer.sensitivity === 'number' ? visualizer.sensitivity : state.sensitivity,
        mode: visualizer.mode ?? state.mode,
      }
    })
    .addCase(playerVisualizerError, state => ({
      ...state,
      isSupported: false,
    }))
})

describe('playerVisualizer reducer - Extended Features', () => {
  describe('Initial state', () => {
    it('should have default mode of "hydra"', () => {
      const state = expectedReducer(undefined, { type: '@@INIT' })
      expect(state.mode).toBe('hydra')
    })
  })

  describe('Visualizer mode changes', () => {
    it('should change mode to "milkdrop" (legacy Butterchurn)', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: { mode: 'milkdrop' },
      }))
      expect(state.mode).toBe('milkdrop')
    })

    it('should change mode to "off"', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: { mode: 'off' },
      }))
      expect(state.mode).toBe('off')
    })

    it('should preserve mode when not specified', () => {
      const stateWithMilkdrop = { ...initialState, mode: 'milkdrop' as VisualizerMode }
      const state = expectedReducer(stateWithMilkdrop, playerCmdOptions({
        visualizer: { sensitivity: 0.5 },
      }))
      expect(state.mode).toBe('milkdrop')
    })
  })

  describe('Combined changes', () => {
    it('should update multiple settings at once', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: {
          mode: 'milkdrop',
          sensitivity: 0.8,
        },
      }))
      expect(state.mode).toBe('milkdrop')
      expect(state.sensitivity).toBe(0.8)
    })

    it('should preserve existing isEnabled when updating other settings', () => {
      const stateDisabled = { ...initialState, isEnabled: false }
      const state = expectedReducer(stateDisabled, playerCmdOptions({
        visualizer: { mode: 'milkdrop' },
      }))
      expect(state.isEnabled).toBe(false)
      expect(state.mode).toBe('milkdrop')
    })
  })

  describe('Error handling', () => {
    it('should preserve new settings when visualizer error occurs', () => {
      const stateWithSettings = {
        ...initialState,
        mode: 'milkdrop' as VisualizerMode,
      }
      const state = expectedReducer(stateWithSettings, playerVisualizerError('WebGL error'))
      expect(state.isSupported).toBe(false)
      expect(state.mode).toBe('milkdrop')
    })
  })
})

/**
 * Tests to verify the actual implementation matches expected behavior.
 */
describe('playerVisualizer actual implementation', () => {
  it('should have mode field in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.mode).toBe('hydra')
  })

  it('should update mode via PLAYER_CMD_OPTIONS', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { mode: 'milkdrop' } },
    })
    expect(newState.mode).toBe('milkdrop')
  })

  it('should have no hydraCode in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.hydraCode).toBeUndefined()
  })

  it('should update hydraCode via VISUALIZER_HYDRA_CODE', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const code = 'osc(10).out()'
    const newState = reducer(state, {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code },
    })
    expect(newState.hydraCode).toBe(code)
  })

  it('should replace hydraCode on subsequent VISUALIZER_HYDRA_CODE', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'osc(10).out()' },
    })
    state = reducer(state, {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'noise(5).out()' },
    })
    expect(state.hydraCode).toBe('noise(5).out()')
  })

  it('should preserve hydraCode when other options change', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'osc(10).out()' },
    })
    state = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { sensitivity: 0.5 } },
    })
    expect(state.hydraCode).toBe('osc(10).out()')
    expect(state.sensitivity).toBe(0.5)
  })
})
