import { describe, expect, it } from 'vitest'
import { measureReplayGain } from './measure'

/**
 * Conformance for whichever backend measure.ts currently exports, so swapping
 * the backend doesn't change what's expected.
 */

const dbfsToAmp = (dbfs: number) => 10 ** (dbfs / 20)

function sine (freq: number, dbfs: number, seconds: number, sampleRate: number): Float32Array {
  const out = new Float32Array(Math.round(seconds * sampleRate))
  const amp = dbfsToAmp(dbfs)

  for (let i = 0; i < out.length; i++) {
    out[i] = amp * Math.sin(2 * Math.PI * freq * i / sampleRate)
  }

  return out
}

const stereo = (ch: Float32Array) => [ch, Float32Array.from(ch)]

describe.each([48000, 44100])('measureReplayGain @ %ikHz', (sampleRate) => {
  it('a -23 LUFS tone wants +5 dB', () => {
    const result = measureReplayGain(stereo(sine(997, -23, 20, sampleRate)), sampleRate)

    expect(result.lufs).toBeCloseTo(-23, 1)
    expect(result.rgTrackGain).toBeCloseTo(5, 1)
    expect(result.rgTrackPeak).toBeCloseTo(dbfsToAmp(-23), 3)
  })
})

describe('measureReplayGain', () => {
  const sr = 48000

  it('returns null for silence', () => {
    expect(measureReplayGain(stereo(new Float32Array(sr * 10)), sr)).toBeNull()
  })

  it('returns null for a clip under one 400ms block', () => {
    expect(measureReplayGain(stereo(sine(997, -23, 0.1, sr)), sr)).toBeNull()
  })

  it('excludes LFE from loudness but not from peak', () => {
    // canary for the backend's BS.1770-4 Table 1 channel weights: if it
    // weights every channel 1.0, lufs lands near -8.9 instead of -23
    const surround = [
      sine(997, -28, 20, sr), sine(997, -28, 20, sr), sine(997, -24, 20, sr),
      sine(997, -6, 20, sr), // LFE, loudest channel in the file
      sine(997, -30, 20, sr), sine(997, -30, 20, sr),
    ]
    const result = measureReplayGain(surround, sr)

    expect(result.lufs).toBeCloseTo(-23, 1)
    expect(result.rgTrackPeak).toBeCloseTo(dbfsToAmp(-6), 3)
  })
})
