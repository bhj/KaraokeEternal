import { getPresetByIndex, getPresetCount } from '../components/hydraPresets'

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
