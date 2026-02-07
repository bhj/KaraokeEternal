import { describe, it, expect } from 'vitest'
import { createReducer, createAction } from '@reduxjs/toolkit'
import {
  PLAYER_CMD_OPTIONS,
  PLAYER_LOAD,
  PLAYER_VISUALIZER_ERROR,
  VISUALIZER_HYDRA_CODE,
  VISUALIZER_STATE_SYNC,
} from 'shared/actionTypes'
import { AUDIO_RESPONSE_DEFAULTS } from 'shared/types'

/**
 * Tests for the playerVisualizer module.
 * TDD: These tests define the expected behavior for visualizer features:
 * - Visualizer modes (hydra, off) — milkdrop removed
 */

export type VisualizerMode
  = | 'hydra' // Hydra video synth
    | 'off'

interface PlayerVisualizerState {
  isEnabled: boolean
  isSupported: boolean
  sensitivity: number
  mode: VisualizerMode
}

const initialState: PlayerVisualizerState = {
  isEnabled: true,
  isSupported: true,
  sensitivity: 1,
  mode: 'hydra',
}

interface ExtendedVisualizerOptions {
  sensitivity?: number
  isEnabled?: boolean
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
    it('should change mode to "off"', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: { mode: 'off' },
      }))
      expect(state.mode).toBe('off')
    })

    it('should preserve mode when not specified', () => {
      const stateWithOff = { ...initialState, mode: 'off' as VisualizerMode }
      const state = expectedReducer(stateWithOff, playerCmdOptions({
        visualizer: { sensitivity: 0.5 },
      }))
      expect(state.mode).toBe('off')
    })
  })

  describe('Combined changes', () => {
    it('should update multiple settings at once', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: {
          mode: 'off',
          sensitivity: 0.8,
        },
      }))
      expect(state.mode).toBe('off')
      expect(state.sensitivity).toBe(0.8)
    })

    it('should preserve existing isEnabled when updating other settings', () => {
      const stateDisabled = { ...initialState, isEnabled: false }
      const state = expectedReducer(stateDisabled, playerCmdOptions({
        visualizer: { mode: 'off' },
      }))
      expect(state.isEnabled).toBe(false)
      expect(state.mode).toBe('off')
    })
  })

  describe('Error handling', () => {
    it('should preserve new settings when visualizer error occurs', () => {
      const stateWithSettings = {
        ...initialState,
        mode: 'off' as VisualizerMode,
      }
      const state = expectedReducer(stateWithSettings, playerVisualizerError('WebGL error'))
      expect(state.isSupported).toBe(false)
      expect(state.mode).toBe('off')
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
      payload: { visualizer: { mode: 'off' } },
    })
    expect(newState.mode).toBe('off')
  })

  it('should guard unknown modes to hydra', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { mode: 'milkdrop' as never } },
    })
    expect(newState.mode).toBe('hydra')
  })

  it('should have hydraCode equal to getDefaultPreset() in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const { getDefaultPreset } = await import('routes/Orchestrator/components/hydraPresets')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.hydraCode).toBe(getDefaultPreset())
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

  it('should not have presetKey or presetName in state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect('presetKey' in state).toBe(false)
    expect('presetName' in state).toBe(false)
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

  it('PLAYER_LOAD should preserve initial hydraCode (getRandomPreset guard)', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const { getDefaultPreset } = await import('routes/Orchestrator/components/hydraPresets')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, { type: PLAYER_LOAD })
    expect(newState.hydraCode).toBe(getDefaultPreset())
  })

  it('PLAYER_LOAD should preserve existing hydraCode', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, { type: VISUALIZER_HYDRA_CODE, payload: { code: 'osc(10).out()' } })
    expect(state.hydraCode).toBe('osc(10).out()')
    state = reducer(state, { type: PLAYER_LOAD })
    // hydraCode should be preserved (not wiped)
    expect(state.hydraCode).toBe('osc(10).out()')
  })
})

describe('playerVisualizer allowCamera', () => {
  it('should have allowCamera=false in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.allowCamera).toBe(false)
  })

  it('should set allowCamera=true via PLAYER_CMD_OPTIONS', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { allowCamera: true } },
    })
    expect(newState.allowCamera).toBe(true)
  })

  it('should preserve allowCamera when not specified in PLAYER_CMD_OPTIONS', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { allowCamera: true } },
    })
    const newState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { sensitivity: 0.5 } },
    })
    expect(newState.allowCamera).toBe(true)
  })

  it('should set allowCamera=false via PLAYER_CMD_OPTIONS', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { allowCamera: true } },
    })
    const newState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { allowCamera: false } },
    })
    expect(newState.allowCamera).toBe(false)
  })
})

describe('playerVisualizer cycleOnSongTransition', () => {
  it('should have cycleOnSongTransition=false in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.cycleOnSongTransition).toBe(false)
  })

  it('should set cycleOnSongTransition=true via PLAYER_CMD_OPTIONS', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const nextState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { cycleOnSongTransition: true } },
    })
    expect(nextState.cycleOnSongTransition).toBe(true)
  })

  it('should preserve cycleOnSongTransition when omitted', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { cycleOnSongTransition: true } },
    })
    const nextState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { sensitivity: 0.5 } },
    })
    expect(nextState.cycleOnSongTransition).toBe(true)
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

describe('playerVisualizer state sync', () => {
  it('should update injectionLevel via VISUALIZER_STATE_SYNC', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, {
      type: VISUALIZER_STATE_SYNC,
      payload: { injectionLevel: 'high' },
    })
    expect(newState.injectionLevel).toBe('high')
  })

  it('should update allowCamera via VISUALIZER_STATE_SYNC', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, {
      type: VISUALIZER_STATE_SYNC,
      payload: { allowCamera: true },
    })
    expect(newState.allowCamera).toBe(true)
  })

  it('should update presetCategory via VISUALIZER_STATE_SYNC', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, {
      type: VISUALIZER_STATE_SYNC,
      payload: { presetCategory: 'camera' },
    })
    expect(newState.presetCategory).toBe('camera')
  })

  it('should not overwrite unspecified fields in VISUALIZER_STATE_SYNC', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: VISUALIZER_STATE_SYNC,
      payload: { injectionLevel: 'high', allowCamera: true },
    })
    // Only update presetCategory, injectionLevel and allowCamera should be preserved
    const newState = reducer(state, {
      type: VISUALIZER_STATE_SYNC,
      payload: { presetCategory: 'feedback' },
    })
    expect(newState.injectionLevel).toBe('high')
    expect(newState.allowCamera).toBe(true)
    expect(newState.presetCategory).toBe('feedback')
  })

  it('should update injectionLevel from VISUALIZER_HYDRA_CODE payload', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'osc(10).out()', injectionLevel: 'low' },
    })
    expect(newState.injectionLevel).toBe('low')
  })

  it('should not overwrite injectionLevel when VISUALIZER_HYDRA_CODE has no injectionLevel', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    let state = reducer(undefined, { type: '@@INIT' })
    state = reducer(state, {
      type: VISUALIZER_STATE_SYNC,
      payload: { injectionLevel: 'high' },
    })
    const newState = reducer(state, {
      type: VISUALIZER_HYDRA_CODE,
      payload: { code: 'osc(10).out()' },
    })
    expect(newState.injectionLevel).toBe('high')
  })

  it('should have injectionLevel=med in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.injectionLevel).toBe('med')
  })
})
