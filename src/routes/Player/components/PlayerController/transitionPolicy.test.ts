import { describe, it, expect } from 'vitest'
import { shouldApplyStartingPresetAtSessionStart, shouldCyclePresetOnSongTransition, shouldApplyStartingPresetOnIdle, shouldApplyFolderDefaultOnIdle, shouldApplyFolderDefaultAtSessionStart } from './transitionPolicy'

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

  describe('shouldApplyFolderDefaultOnIdle', () => {
    it('returns true only when folder-backed runtime pool is ready', () => {
      expect(shouldApplyFolderDefaultOnIdle({
        startingPresetId: null,
        queueId: -1,
        hasAppliedStartingPreset: false,
        runtimePresetSource: 'folder',
        runtimePresetCount: 12,
      })).toBe(true)
    })

    it('returns false while runtime pool is still gallery fallback', () => {
      expect(shouldApplyFolderDefaultOnIdle({
        startingPresetId: null,
        queueId: -1,
        hasAppliedStartingPreset: false,
        runtimePresetSource: 'gallery',
        runtimePresetCount: 58,
      })).toBe(false)
    })

    it('returns false when starting preset exists', () => {
      expect(shouldApplyFolderDefaultOnIdle({
        startingPresetId: 42,
        queueId: -1,
        hasAppliedStartingPreset: false,
        runtimePresetSource: 'folder',
        runtimePresetCount: 12,
      })).toBe(false)
    })

    it('returns false when already applied or when not idle', () => {
      expect(shouldApplyFolderDefaultOnIdle({
        startingPresetId: null,
        queueId: -1,
        hasAppliedStartingPreset: true,
        runtimePresetSource: 'folder',
        runtimePresetCount: 12,
      })).toBe(false)

      expect(shouldApplyFolderDefaultOnIdle({
        startingPresetId: null,
        queueId: 100,
        hasAppliedStartingPreset: false,
        runtimePresetSource: 'folder',
        runtimePresetCount: 12,
      })).toBe(false)
    })
  })

  describe('shouldApplyFolderDefaultAtSessionStart', () => {
    it('returns true on session start with folder configured and no starting preset', () => {
      expect(shouldApplyFolderDefaultAtSessionStart({
        startingPresetId: null,
        currentQueueId: -1,
        historyJSON: '[]',
        nextQueueId: 100,
        hasAppliedStartingPreset: false,
        runtimePresetSource: 'folder',
        runtimePresetCount: 12,
      })).toBe(true)
    })

    it('returns false when starting preset is set (that path handles it)', () => {
      expect(shouldApplyFolderDefaultAtSessionStart({
        startingPresetId: 42,
        currentQueueId: -1,
        historyJSON: '[]',
        nextQueueId: 100,
        hasAppliedStartingPreset: false,
        runtimePresetSource: 'folder',
        runtimePresetCount: 12,
      })).toBe(false)
    })

    it('returns false when not at session start', () => {
      expect(shouldApplyFolderDefaultAtSessionStart({
        startingPresetId: null,
        currentQueueId: 10,
        historyJSON: '[10]',
        nextQueueId: 11,
        hasAppliedStartingPreset: false,
        runtimePresetSource: 'folder',
        runtimePresetCount: 12,
      })).toBe(false)
    })

    it('returns false when already applied', () => {
      expect(shouldApplyFolderDefaultAtSessionStart({
        startingPresetId: null,
        currentQueueId: -1,
        historyJSON: '[]',
        nextQueueId: 100,
        hasAppliedStartingPreset: true,
        runtimePresetSource: 'folder',
        runtimePresetCount: 12,
      })).toBe(false)
    })

    it('returns false when runtime pool is gallery (not yet loaded)', () => {
      expect(shouldApplyFolderDefaultAtSessionStart({
        startingPresetId: null,
        currentQueueId: -1,
        historyJSON: '[]',
        nextQueueId: 100,
        hasAppliedStartingPreset: false,
        runtimePresetSource: 'gallery',
        runtimePresetCount: 58,
      })).toBe(false)
    })
  })
})
