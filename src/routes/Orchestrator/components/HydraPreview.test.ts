import { describe, it, expect } from 'vitest'

// Test the preview audio mode logic (extracted from HydraPreview)
describe('HydraPreview audio mode', () => {
  function getPreviewAudioMode (
    fftData: unknown | null,
    isPlayerPresent: boolean,
  ): 'live' | 'simulated' {
    return isPlayerPresent && fftData !== null ? 'live' : 'simulated'
  }

  it('returns live when fft data present and player present', () => {
    const fft = { fft: [0.5], bass: 0.6, mid: 0.4, treble: 0.2, beat: 0, energy: 0.5, bpm: 0.5, bright: 0.4 }
    expect(getPreviewAudioMode(fft, true)).toBe('live')
  })

  it('returns simulated when no fft data', () => {
    expect(getPreviewAudioMode(null, true)).toBe('simulated')
  })

  it('returns simulated when player not present', () => {
    const fft = { fft: [0.5], bass: 0.6, mid: 0.4, treble: 0.2, beat: 0, energy: 0.5, bpm: 0.5, bright: 0.4 }
    expect(getPreviewAudioMode(fft, false)).toBe('simulated')
  })
})
