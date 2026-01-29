import { describe, it, expect } from 'vitest'
import { createReducer, createAction } from '@reduxjs/toolkit'
import {
  PLAYER_CMD_OPTIONS,
  PLAYER_LOAD,
  PLAYER_VISUALIZER_ERROR,
} from 'shared/actionTypes'

/**
 * Tests for the extended playerVisualizer module.
 * TDD: These tests define the expected behavior for new visualizer features:
 * - Multiple visualizer modes (physarum, liquid, milkdrop)
 * - Color palettes
 * - Lyrics overlay modes
 */

// Define the extended state interface with new features
export type VisualizerMode
  = | 'physarum' // Slime mold pheromone simulation
    | 'milkdrop' // Legacy Butterchurn (fallback)
    | 'off'

export type ColorPalette = 'warm' | 'cool' | 'neon' | 'monochrome' | 'rainbow'

export type LyricsMode = 'cdgOnly' | 'msdfOverlay' | 'msdfOnly' | 'off'

interface PlayerVisualizerState {
  isEnabled: boolean
  isSupported: boolean
  presetKey: string
  presetName: string
  sensitivity: number
  // New fields
  mode: VisualizerMode
  colorPalette: ColorPalette
  lyricsMode: LyricsMode
}

const initialState: PlayerVisualizerState = {
  isEnabled: true,
  isSupported: true,
  presetKey: '',
  presetName: '',
  sensitivity: 1,
  // New defaults
  mode: 'physarum', // Default to new modern visualizer
  colorPalette: 'warm',
  lyricsMode: 'cdgOnly',
}

// Define the extended visualizer options
interface ExtendedVisualizerOptions {
  sensitivity?: number
  isEnabled?: boolean
  nextPreset?: boolean
  prevPreset?: boolean
  randomPreset?: boolean
  // New options
  mode?: VisualizerMode
  colorPalette?: ColorPalette
  lyricsMode?: LyricsMode
}

// Create test actions
const playerCmdOptions = createAction<{ visualizer: ExtendedVisualizerOptions }>(PLAYER_CMD_OPTIONS)
const playerLoad = createAction(PLAYER_LOAD)
const playerVisualizerError = createAction<string>(PLAYER_VISUALIZER_ERROR)

// Expected reducer with new features
const expectedReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(playerLoad, state => ({
      ...state,
      // Randomize preset on load (existing behavior)
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
        // New fields
        mode: visualizer.mode ?? state.mode,
        colorPalette: visualizer.colorPalette ?? state.colorPalette,
        lyricsMode: visualizer.lyricsMode ?? state.lyricsMode,
      }
    })
    .addCase(playerVisualizerError, state => ({
      ...state,
      isSupported: false,
    }))
})

describe('playerVisualizer reducer - Extended Features', () => {
  describe('Initial state', () => {
    it('should have default mode of "physarum"', () => {
      const state = expectedReducer(undefined, { type: '@@INIT' })
      expect(state.mode).toBe('physarum')
    })

    it('should have default colorPalette of "warm"', () => {
      const state = expectedReducer(undefined, { type: '@@INIT' })
      expect(state.colorPalette).toBe('warm')
    })

    it('should have default lyricsMode of "cdgOnly"', () => {
      const state = expectedReducer(undefined, { type: '@@INIT' })
      expect(state.lyricsMode).toBe('cdgOnly')
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

  describe('Color palette changes', () => {
    it('should change colorPalette to "cool"', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: { colorPalette: 'cool' },
      }))
      expect(state.colorPalette).toBe('cool')
    })

    it('should change colorPalette to "neon"', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: { colorPalette: 'neon' },
      }))
      expect(state.colorPalette).toBe('neon')
    })

    it('should change colorPalette to "monochrome"', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: { colorPalette: 'monochrome' },
      }))
      expect(state.colorPalette).toBe('monochrome')
    })

    it('should change colorPalette to "rainbow"', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: { colorPalette: 'rainbow' },
      }))
      expect(state.colorPalette).toBe('rainbow')
    })

    it('should preserve colorPalette when not specified', () => {
      const stateWithNeon = { ...initialState, colorPalette: 'neon' as ColorPalette }
      const state = expectedReducer(stateWithNeon, playerCmdOptions({
        visualizer: { mode: 'milkdrop' },
      }))
      expect(state.colorPalette).toBe('neon')
    })
  })

  describe('Lyrics mode changes', () => {
    it('should change lyricsMode to "msdfOverlay"', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: { lyricsMode: 'msdfOverlay' },
      }))
      expect(state.lyricsMode).toBe('msdfOverlay')
    })

    it('should change lyricsMode to "msdfOnly"', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: { lyricsMode: 'msdfOnly' },
      }))
      expect(state.lyricsMode).toBe('msdfOnly')
    })

    it('should change lyricsMode to "off"', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: { lyricsMode: 'off' },
      }))
      expect(state.lyricsMode).toBe('off')
    })

    it('should preserve lyricsMode when not specified', () => {
      const stateWithMsdf = { ...initialState, lyricsMode: 'msdfOverlay' as LyricsMode }
      const state = expectedReducer(stateWithMsdf, playerCmdOptions({
        visualizer: { colorPalette: 'cool' },
      }))
      expect(state.lyricsMode).toBe('msdfOverlay')
    })
  })

  describe('Combined changes', () => {
    it('should update multiple settings at once', () => {
      const state = expectedReducer(initialState, playerCmdOptions({
        visualizer: {
          mode: 'milkdrop',
          colorPalette: 'neon',
          lyricsMode: 'msdfOverlay',
          sensitivity: 0.8,
        },
      }))
      expect(state.mode).toBe('milkdrop')
      expect(state.colorPalette).toBe('neon')
      expect(state.lyricsMode).toBe('msdfOverlay')
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
        colorPalette: 'neon' as ColorPalette,
        lyricsMode: 'msdfOverlay' as LyricsMode,
      }
      const state = expectedReducer(stateWithSettings, playerVisualizerError('WebGL error'))
      expect(state.isSupported).toBe(false)
      expect(state.mode).toBe('milkdrop')
      expect(state.colorPalette).toBe('neon')
      expect(state.lyricsMode).toBe('msdfOverlay')
    })
  })
})

/**
 * Tests to verify the actual implementation matches expected behavior.
 */
describe('playerVisualizer actual implementation', () => {
  // Dynamic import to avoid circular dependencies with presets
  it('should have mode field in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.mode).toBe('physarum')
  })

  it('should have colorPalette field in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.colorPalette).toBe('warm')
  })

  it('should have lyricsMode field in initial state', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.lyricsMode).toBe('cdgOnly')
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

  it('should update colorPalette via PLAYER_CMD_OPTIONS', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { colorPalette: 'neon' } },
    })
    expect(newState.colorPalette).toBe('neon')
  })

  it('should update lyricsMode via PLAYER_CMD_OPTIONS', async () => {
    const { default: reducer } = await import('./playerVisualizer')
    const state = reducer(undefined, { type: '@@INIT' })
    const newState = reducer(state, {
      type: PLAYER_CMD_OPTIONS,
      payload: { visualizer: { lyricsMode: 'msdfOverlay' } },
    })
    expect(newState.lyricsMode).toBe('msdfOverlay')
  })
})
