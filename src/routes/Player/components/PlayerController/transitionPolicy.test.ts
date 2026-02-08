import { describe, it, expect } from 'vitest'
import { shouldApplyStartingPresetAtSessionStart, shouldCyclePresetOnSongTransition, shouldApplyStartingPresetOnIdle } from './transitionPolicy'

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

  describe('shouldApplyStartingPresetOnIdle', () => {
    it('returns true when idle with a starting preset and not yet applied', () => {
      expect(shouldApplyStartingPresetOnIdle({
        startingPresetId: 42,
        queueId: -1,
        hasAppliedStartingPreset: false,
      })).toBe(true)
    })

    it('returns false when already applied', () => {
      expect(shouldApplyStartingPresetOnIdle({
        startingPresetId: 42,
        queueId: -1,
        hasAppliedStartingPreset: true,
      })).toBe(false)
    })

    it('returns false when not idle (queueId is a real song)', () => {
      expect(shouldApplyStartingPresetOnIdle({
        startingPresetId: 42,
        queueId: 100,
        hasAppliedStartingPreset: false,
      })).toBe(false)
    })

    it('returns false when no starting preset configured', () => {
      expect(shouldApplyStartingPresetOnIdle({
        startingPresetId: null,
        queueId: -1,
        hasAppliedStartingPreset: false,
      })).toBe(false)

      expect(shouldApplyStartingPresetOnIdle({
        startingPresetId: undefined,
        queueId: -1,
        hasAppliedStartingPreset: false,
      })).toBe(false)
    })
  })
})
