import { describe, it, expect } from 'vitest'
import { shouldApplyStartingPresetAtSessionStart, shouldCyclePresetOnSongTransition } from './transitionPolicy'

describe('transitionPolicy', () => {
  it('applies starting preset only on true session start', () => {
    expect(shouldApplyStartingPresetAtSessionStart({
      startingPresetId: 42,
      currentQueueId: -1,
      historyJSON: '[]',
      nextQueueId: 100,
      hasAppliedStartingPreset: false,
    })).toBe(true)

    expect(shouldApplyStartingPresetAtSessionStart({
      startingPresetId: 42,
      currentQueueId: 99,
      historyJSON: '[99]',
      nextQueueId: 100,
      hasAppliedStartingPreset: false,
    })).toBe(false)

    expect(shouldApplyStartingPresetAtSessionStart({
      startingPresetId: 42,
      currentQueueId: -1,
      historyJSON: '[]',
      nextQueueId: 100,
      hasAppliedStartingPreset: true,
    })).toBe(false)
  })

  it('cycles preset only when enabled and transitioning between songs', () => {
    expect(shouldCyclePresetOnSongTransition({
      cycleOnSongTransition: true,
      isVisualizerEnabled: true,
      visualizerMode: 'hydra',
      currentQueueId: 10,
      nextQueueId: 11,
    })).toBe(true)

    expect(shouldCyclePresetOnSongTransition({
      cycleOnSongTransition: false,
      isVisualizerEnabled: true,
      visualizerMode: 'hydra',
      currentQueueId: 10,
      nextQueueId: 11,
    })).toBe(false)

    expect(shouldCyclePresetOnSongTransition({
      cycleOnSongTransition: true,
      isVisualizerEnabled: true,
      visualizerMode: 'off',
      currentQueueId: 10,
      nextQueueId: 11,
    })).toBe(false)

    expect(shouldCyclePresetOnSongTransition({
      cycleOnSongTransition: true,
      isVisualizerEnabled: true,
      visualizerMode: 'hydra',
      currentQueueId: -1,
      nextQueueId: 11,
    })).toBe(false)
  })
})
