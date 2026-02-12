import type { FftPayload } from 'shared/fftPayload'

export const FFT_STALE_MS = 1500

export type CameraRelayStatus = 'idle' | 'connecting' | 'active' | 'error'

export interface CameraPipelineState {
  level: 'off' | 'partial' | 'live'
  label: 'Off' | 'Partial' | 'Live'
  missing: Array<'publish/subscribe' | 'hydra source bind'>
}

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

interface CameraPipelineInput {
  cameraStatus: CameraRelayStatus
  usesCameraSource: boolean
  boundSourceCount: number
}

export function getCameraPipelineState ({
  cameraStatus,
  usesCameraSource,
  boundSourceCount,
}: CameraPipelineInput): CameraPipelineState {
  if (cameraStatus === 'idle' && !usesCameraSource) {
    return {
      level: 'off',
      label: 'Off',
      missing: [],
    }
  }

  const missing: CameraPipelineState['missing'] = []

  if (cameraStatus !== 'active') {
    missing.push('publish/subscribe')
  }

  if (usesCameraSource && boundSourceCount < 1) {
    missing.push('hydra source bind')
  }

  if (missing.length === 0) {
    return {
      level: 'live',
      label: 'Live',
      missing: [],
    }
  }

  return {
    level: 'partial',
    label: 'Partial',
    missing,
  }
}
