import type { FftPayload } from 'shared/fftPayload'

export const FFT_STALE_MS = 1500

export function isPreviewLive (
  fftData: FftPayload | null,
  isPlayerPresent: boolean,
  lastFftAt: number | null,
  now: number = Date.now(),
): boolean {
  if (!isPlayerPresent || !fftData || lastFftAt == null) return false
  return now - lastFftAt <= FFT_STALE_MS
}

export function selectPreviewVideoElement (
  local: HTMLVideoElement | null,
  remote: HTMLVideoElement | null,
): HTMLVideoElement | null {
  return local ?? remote ?? null
}
