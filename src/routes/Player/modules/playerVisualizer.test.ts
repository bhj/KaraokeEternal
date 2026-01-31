import { describe, it, expect } from 'vitest'
import { createReducer, createAction } from '@reduxjs/toolkit'
import {
  PLAYER_CMD_OPTIONS,
  PLAYER_LOAD,
  PLAYER_VISUALIZER_ERROR,
  VISUALIZER_HYDRA_CODE,
} from 'shared/actionTypes'
import { AUDIO_RESPONSE_DEFAULTS } from 'shared/types'

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

  it('should have hydraPresetIndex in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(typeof state.hydraPresetIndex).toBe('number')
    expect(state.hydraPresetIndex).toBeGreaterThanOrEqual(0)
  })

  it('should have hydraPresetName in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(typeof state.hydraPresetName).toBe('string')
    expect(state.hydraPresetName).toContain('[')
    expect(state.hydraPresetName).toContain(']')
  })

  /**
   * Payload passthrough test: dispatch VISUALIZER_HYDRA_CODE with combined
   * { code, hydraPresetIndex } payload → verify reducer sets both hydraCode
   * AND hydraPresetIndex AND hydraPresetName. This validates the server
   * passthrough contract (server relays full payload object unchanged).
   */
  it('should extract hydraPresetIndex from VISUALIZER_HYDRA_CODE payload', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const { getPresetLabel } = await import('routes/Orchestrator/components/hydraPresets')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'noise(5).out()', hydraPresetIndex: 5 },
    })
    expect(state.hydraCode).toBe('noise(5).out()')
    expect(state.hydraPresetIndex).toBe(5)
    expect(state.hydraPresetName).toBe(getPresetLabel(5))
  })

  it('should preserve hydraPresetIndex when code-only payload received', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'noise(5).out()', hydraPresetIndex: 5 },
    })
    state = reducer(state, {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'osc(10).out()' },
    })
    expect(state.hydraCode).toBe('osc(10).out()')
    // No preset index in payload → should keep existing (Orchestrator send, not preset nav)
    expect(state.hydraPresetIndex).toBe(5)
  })

  it('should NOT randomize hydra preset on PLAYER_LOAD', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const initialIdx = state.hydraPresetIndex
    const newState = reducer(state, { type: PLAYER_LOAD })
    // Hydra preset should NOT change on player load
    expect(newState.hydraPresetIndex).toBe(initialIdx)
  })
})

describe('playerVisualizer hasHydraUpdate lifecycle', () => {
  it('should have hasHydraUpdate=false in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.hasHydraUpdate).toBe(false)
  })

  it('should set hasHydraUpdate=true on VISUALIZER_HYDRA_CODE', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, { type: VISUALIZER_HYDRA_CODE, payload: { code: 'osc().out()' } })
    expect(state.hasHydraUpdate).toBe(true)
  })

  it('should reset hasHydraUpdate=false on PLAYER_LOAD', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, { type: VISUALIZER_HYDRA_CODE, payload: { code: 'osc().out()' } })
    expect(state.hasHydraUpdate).toBe(true)
    state = reducer(state, { type: PLAYER_LOAD })
    expect(state.hasHydraUpdate).toBe(false)
  })

  it('PLAYER_LOAD should not introduce hydraCode (getRandomPreset guard)', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, { type: PLAYER_LOAD })
    // getRandomPreset() must only return { presetKey, presetName }.
    // If this fails, update PLAYER_LOAD handler to explicitly handle hydraCode.
    expect(newState.hydraCode).toBeUndefined()
  })

  it('PLAYER_LOAD should preserve existing hydraCode', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, { type: VISUALIZER_HYDRA_CODE, payload: { code: 'osc(10).out()' } })
    expect(state.hydraCode).toBe('osc(10).out()')
    state = reducer(state, { type: PLAYER_LOAD })
    // hydraCode should be preserved (not wiped) — getRandomPreset() doesn't return hydraCode
    expect(state.hydraCode).toBe('osc(10).out()')
  })
})

describe('playerVisualizer audioResponse', () => {
  it('should have audioResponse matching AUDIO_RESPONSE_DEFAULTS in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.audioResponse).toEqual(AUDIO_RESPONSE_DEFAULTS)
  })

  it('should update all audioResponse fields via PLAYER_CMD_OPTIONS', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: {
        visualizer: {
          audioResponse: { globalGain: 2.0, bassWeight: 2.5, midWeight: 1.5, trebleWeight: 2.0 },
        },
      },
    })
    expect(newState.audioResponse).toEqual({
      globalGain: 2.0,
      bassWeight: 2.5,
      midWeight: 1.5,
      trebleWeight: 2.0,
    })
  })

  it('should merge partial audioResponse with defaults', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: {
        visualizer: {
          audioResponse: { bassWeight: 2.0 },
        },
      },
    })
    expect(newState.audioResponse).toEqual({
      globalGain: 1.0,
      bassWeight: 2.0,
      midWeight: 1.0,
      trebleWeight: 1.0,
    })
  })

  it('should preserve audioResponse across PLAYER_CMD_OPTIONS with only sensitivity change', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: {
        visualizer: {
          audioResponse: { globalGain: 2.0, bassWeight: 2.5, midWeight: 1.5, trebleWeight: 2.0 },
        },
      },
    })
    const newState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { sensitivity: 0.5 } },
    })
    expect(newState.audioResponse).toEqual({
      globalGain: 2.0,
      bassWeight: 2.5,
      midWeight: 1.5,
      trebleWeight: 2.0,
    })
    expect(newState.sensitivity).toBe(0.5)
  })

  it('should preserve audioResponse across PLAYER_LOAD', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: {
        visualizer: {
          audioResponse: { globalGain: 2.0, bassWeight: 2.5, midWeight: 1.5, trebleWeight: 2.0 },
        },
      },
    })
    const newState = reducer(state, { type: PLAYER_LOAD })
    expect(newState.audioResponse).toEqual({
      globalGain: 2.0,
      bassWeight: 2.5,
      midWeight: 1.5,
      trebleWeight: 2.0,
    })
  })

  it('should preserve audioResponse across VISUALIZER_HYDRA_CODE', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: {
        visualizer: {
          audioResponse: { globalGain: 2.0, bassWeight: 2.5, midWeight: 1.5, trebleWeight: 2.0 },
        },
      },
    })
    const newState = reducer(state, {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'osc(10).out()' },
    })
    expect(newState.audioResponse).toEqual({
      globalGain: 2.0,
      bassWeight: 2.5,
      midWeight: 1.5,
      trebleWeight: 2.0,
    })
  })
})
