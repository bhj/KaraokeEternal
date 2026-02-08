import type { VisualizerMode } from 'shared/types'

interface StartingPresetParams {
  startingPresetId?: number | null
  currentQueueId: number
  historyJSON: string
  nextQueueId?: number
  hasAppliedStartingPreset: boolean
}

interface CyclePresetParams {
  cycleOnSongTransition: boolean
  isVisualizerEnabled: boolean
  visualizerMode: VisualizerMode
  currentQueueId?: number
  nextQueueId?: number
}

/**
 * Session start is the first transition from idle queue (-1) with empty history.
 * Starting preset should only apply once per session.
 */
export function shouldApplyStartingPresetAtSessionStart ({
  startingPresetId,
  currentQueueId,
  historyJSON,
  nextQueueId,
  hasAppliedStartingPreset,
}: StartingPresetParams): boolean {
  return typeof startingPresetId === 'number'
    && hasAppliedStartingPreset !== true
    && currentQueueId === -1
    && historyJSON === '[]'
    && typeof nextQueueId === 'number'
}

interface IdlePresetParams {
  startingPresetId?: number | null
  queueId: number
  hasAppliedStartingPreset: boolean
}

/**
 * Idle init: apply the starting preset immediately when player is idle
 * (queueId === -1) and a starting preset is configured.
 * Fires once per idle session (guarded by hasAppliedStartingPreset).
 */
export function shouldApplyStartingPresetOnIdle ({
  startingPresetId,
  queueId,
  hasAppliedStartingPreset,
}: IdlePresetParams): boolean {
  return typeof startingPresetId === 'number'
    && queueId === -1
    && hasAppliedStartingPreset !== true
}

/**
 * Cycle only on real song-to-song transitions when Hydra visualizer is active.
 */
export function shouldCyclePresetOnSongTransition ({
  cycleOnSongTransition,
  isVisualizerEnabled,
  visualizerMode,
  currentQueueId,
  nextQueueId,
}: CyclePresetParams): boolean {
  return cycleOnSongTransition
    && isVisualizerEnabled
    && visualizerMode === 'hydra'
    && typeof currentQueueId === 'number'
    && typeof nextQueueId === 'number'
    && currentQueueId >= 0
    && nextQueueId >= 0
    && currentQueueId !== nextQueueId
}
