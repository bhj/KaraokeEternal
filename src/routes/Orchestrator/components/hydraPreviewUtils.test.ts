// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { FFT_STALE_MS, isPreviewLive, selectPreviewVideoElement } from './hydraPreviewUtils'
import type { FftPayload } from 'shared/fftPayload'

describe('hydraPreviewUtils', () => {
  const fftPayload: FftPayload = {
    fft: [0.2, 0.4, 0.1, 0.3],
    bass: 0.4,
    mid: 0.3,
    treble: 0.2,
    beat: 0.1,
    energy: 0.5,
    bpm: 0.5,
    bright: 0.3,
  }

  it('returns live only when player present and fft is fresh', () => {
    const now = 1_000_000
    expect(isPreviewLive(fftPayload, true, now - 100, now)).toBe(true)
    expect(isPreviewLive(fftPayload, true, now - (FFT_STALE_MS + 1), now)).toBe(false)
  })

  it('returns simulated when player not present or fft missing', () => {
    const now = 1_000_000
    expect(isPreviewLive(null, true, now, now)).toBe(false)
    expect(isPreviewLive(fftPayload, false, now, now)).toBe(false)
  })

  it('prefers local video element when present', () => {
    const local = document.createElement('video')
    const remote = document.createElement('video')
    expect(selectPreviewVideoElement(local, remote)).toBe(local)
    expect(selectPreviewVideoElement(null, remote)).toBe(remote)
    expect(selectPreviewVideoElement(null, null)).toBeNull()
  })
})
