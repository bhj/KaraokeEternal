import { stripInjectedLines } from '../../../lib/injectedLines'
import { AUDIO_RESPONSE_DEFAULTS, type AudioResponseState, type VisualizerMode } from 'shared/types'
import { getPresetByIndex, getPresetCount } from '../components/hydraPresets'

interface PreviewVisualizerSource {
  mode?: VisualizerMode
  isEnabled?: boolean
  sensitivity?: number
  allowCamera?: boolean
  audioResponse?: Partial<AudioResponseState>
}

export interface PreviewHydraState {
  mode: VisualizerMode
  isEnabled: boolean
  sensitivity: number
  allowCamera: boolean
  audioResponse: AudioResponseState
}

function toFiniteNumber (value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeMode (value: unknown): VisualizerMode {
  return value === 'off' ? 'off' : 'hydra'
}

/**
 * Resolve the visualizer settings the Orchestrator preview should use.
 *
 * - When Orchestrator has observed a direct hydra update, prefer playerVisualizer
 *   (authoritative latest stream from VISUALIZER_HYDRA_CODE / sync actions).
 * - Otherwise prefer status.visualizer (hydrated from PLAYER_STATUS / options).
 * - Always merge audioResponse with defaults and sanitize numerics.
 */
export function resolvePreviewHydraState (
  hasHydraUpdate: boolean,
  playerVisualizer: PreviewVisualizerSource | null | undefined,
  statusVisualizer: PreviewVisualizerSource | null | undefined,
): PreviewHydraState {
  const preferred = hasHydraUpdate ? playerVisualizer : statusVisualizer
  const fallback = hasHydraUpdate ? statusVisualizer : playerVisualizer

  const rawAudioResponse = preferred?.audioResponse ?? fallback?.audioResponse ?? {}
  const mergedAudioResponse = {
    ...AUDIO_RESPONSE_DEFAULTS,
    ...rawAudioResponse,
  }

  return {
    mode: normalizeMode(preferred?.mode ?? fallback?.mode),
    isEnabled: typeof preferred?.isEnabled === 'boolean'
      ? preferred.isEnabled
      : typeof fallback?.isEnabled === 'boolean'
        ? fallback.isEnabled
        : true,
    sensitivity: Math.max(0.05, toFiniteNumber(preferred?.sensitivity, toFiniteNumber(fallback?.sensitivity, 1))),
    allowCamera: typeof preferred?.allowCamera === 'boolean'
      ? preferred.allowCamera
      : typeof fallback?.allowCamera === 'boolean'
        ? fallback.allowCamera
        : false,
    audioResponse: {
      globalGain: Math.max(0, toFiniteNumber(mergedAudioResponse.globalGain, AUDIO_RESPONSE_DEFAULTS.globalGain)),
      bassWeight: Math.max(0, toFiniteNumber(mergedAudioResponse.bassWeight, AUDIO_RESPONSE_DEFAULTS.bassWeight)),
      midWeight: Math.max(0, toFiniteNumber(mergedAudioResponse.midWeight, AUDIO_RESPONSE_DEFAULTS.midWeight)),
      trebleWeight: Math.max(0, toFiniteNumber(mergedAudioResponse.trebleWeight, AUDIO_RESPONSE_DEFAULTS.trebleWeight)),
    },
  }
}

/**
 * Returns the code that should be displayed in the editor and preview.
 *
 * - Before user edits: remote code overrides localCode (allows collaborator
 *   sketches to appear automatically).
 * - After user edits: localCode is authoritative (prevents visual jumps
 *   while typing).
 */
export function getEffectiveCode (
  localCode: string,
  remoteCode: string | null | undefined,
  userHasEdited: boolean,
): string {
  if (!userHasEdited && remoteCode && remoteCode.trim() !== '') {
    return remoteCode
  }
  return localCode
}

/**
 * Determines whether a remote code update should be shown as a pending banner.
 *
 * Returns the remote code string if:
 *   1. User has edited (otherwise remote applies directly via getEffectiveCode)
 *   2. Remote code is non-empty and differs from local code
 *
 * Returns null otherwise (no banner needed).
 */
export function getPendingRemote (
  remoteCode: string | null | undefined,
  localCode: string,
  userHasEdited: boolean,
): string | null {
  if (!userHasEdited) return null
  if (!remoteCode || remoteCode.trim() === '') return null
  if (remoteCode === localCode) return null
  return remoteCode
}

/**
 * Normalize code for send-ack comparisons.
 * - Strips injected audio lines
 * - Normalizes CRLF to LF
 * - Trims trailing whitespace
 */
export function normalizeCodeForAck (code: string | null | undefined): string | null {
  if (!code) return null
  return stripInjectedLines(code).trimEnd().replace(/\r\n/g, '\n')
}

/**
 * Determines whether a remote preset change should auto-apply in the Orchestrator.
 *
 * Returns true only when:
 * - The index actually changed (not initial render or same index)
 * - User has local edits (otherwise getEffectiveCode handles it)
 * - The remote code matches the gallery entry (validates it's a genuine preset nav)
 */
export function shouldAutoApplyPreset (
  prevIndex: number | undefined,
  currentIndex: number | undefined,
  userHasEdited: boolean,
  remoteCode: string | null | undefined,
): boolean {
  if (prevIndex === undefined) return false
  if (currentIndex === undefined) return false
  if (!userHasEdited) return false
  if (currentIndex === prevIndex) return false
  if (currentIndex < 0 || currentIndex >= getPresetCount()) return false
  if (!remoteCode) return false
  const normalize = (s: string) => s.trim().replace(/\r\n/g, '\n')
  if (normalize(remoteCode) !== normalize(getPresetByIndex(currentIndex))) return false
  return true
}
