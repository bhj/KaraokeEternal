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

interface IdleFolderDefaultParams {
  startingPresetId?: number | null
  queueId: number
  hasAppliedStartingPreset: boolean
  runtimePresetSource: 'gallery' | 'folder'
  runtimePresetCount: number
}

/**
 * Idle init fallback: when no explicit starting preset is set, use the first
 * preset from the configured player folder only after a folder-backed runtime
 * pool is available.
 */
export function shouldApplyFolderDefaultOnIdle ({
  startingPresetId,
  queueId,
  hasAppliedStartingPreset,
  runtimePresetSource,
  runtimePresetCount,
}: IdleFolderDefaultParams): boolean {
  return typeof startingPresetId !== 'number'
    && queueId === -1
    && hasAppliedStartingPreset !== true
    && runtimePresetSource === 'folder'
    && runtimePresetCount > 0
}

interface SessionStartFolderDefaultParams {
  startingPresetId?: number | null
  currentQueueId: number
  historyJSON: string
  nextQueueId?: number
  hasAppliedStartingPreset: boolean
  runtimePresetSource: 'gallery' | 'folder'
  runtimePresetCount: number
}

/**
 * Session start folder default: when no starting preset is configured but a
 * folder-backed runtime pool is active, apply the first folder preset on first
 * play (session start). This covers the case where the user presses Play before
 * idle init fires.
 */
export function shouldApplyFolderDefaultAtSessionStart ({
  startingPresetId,
  currentQueueId,
  historyJSON,
  nextQueueId,
  hasAppliedStartingPreset,
  runtimePresetSource,
  runtimePresetCount,
}: SessionStartFolderDefaultParams): boolean {
  return typeof startingPresetId !== 'number'
    && hasAppliedStartingPreset !== true
    && currentQueueId === -1
    && historyJSON === '[]'
    && typeof nextQueueId === 'number'
    && runtimePresetSource === 'folder'
    && runtimePresetCount > 0
}

interface PoolReadyFolderDefaultParams {
  startingPresetId?: number | null
  queueId: number
  hasAppliedStartingPreset: boolean
  runtimePresetSource: 'gallery' | 'folder'
  runtimePresetCount: number
  historyJSON: string
}

/**
 * Pool-ready fallback: the folder-backed runtime pool arrived after the first
 * song already started playing (async fetch race). Apply the first folder
 * preset if we are still on the very first song and no preset was applied yet.
 *
 * The queueId >= 0 check is mutually exclusive with the idle handler's
 * queueId === -1, preventing double-fire.
 */
export function shouldApplyFolderDefaultOnPoolReady ({
  startingPresetId,
  queueId,
  hasAppliedStartingPreset,
  runtimePresetSource,
  runtimePresetCount,
  historyJSON,
}: PoolReadyFolderDefaultParams): boolean {
  return typeof startingPresetId !== 'number'
    && hasAppliedStartingPreset !== true
    && runtimePresetSource === 'folder'
    && runtimePresetCount > 0
    && historyJSON === '[]'
    && queueId >= 0
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
