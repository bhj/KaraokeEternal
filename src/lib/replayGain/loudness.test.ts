import { describe, expect, it } from 'vitest'
import { kWeightingCoefficients, lufsToTrackGain, measureLoudness } from './loudness'

const SR = 48000

const dbfsToAmp = (dbfs: number) => 10 ** (dbfs / 20)

function sine (freq: number, dbfs: number, seconds: number, sampleRate = SR): Float32Array {
  const out = new Float32Array(Math.round(seconds * sampleRate))
  const amp = dbfsToAmp(dbfs)

  for (let i = 0; i < out.length; i++) {
    out[i] = amp * Math.sin(2 * Math.PI * freq * i / sampleRate)
  }

  return out
}

function silence (seconds: number, sampleRate = SR): Float32Array {
  return new Float32Array(Math.round(seconds * sampleRate))
}

function concat (...parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0

  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }

  return out
}

// same signal in both channels
const stereo = (ch: Float32Array) => [ch, Float32Array.from(ch)]

describe('kWeightingCoefficients', () => {
  it('reproduces the published BS.1770-4 table at 48kHz', () => {
    const [s1, s2] = kWeightingCoefficients(48000)

    // spec values are float32-rounded, hence the loose-ish tolerance
    expect(s1.b0).toBeCloseTo(1.53512485958697, 10)
    expect(s1.b1).toBeCloseTo(-2.69169618940638, 10)
    expect(s1.b2).toBeCloseTo(1.19839281085285, 10)
    expect(s1.a1).toBeCloseTo(-1.69065929318241, 10)
    expect(s1.a2).toBeCloseTo(0.73248077421585, 10)

    expect(s2.b0).toBe(1)
    expect(s2.b1).toBe(-2)
    expect(s2.b2).toBe(1)
    expect(s2.a1).toBeCloseTo(-1.99004745483398, 7)
    expect(s2.a2).toBeCloseTo(0.99007225036621, 7)
  })

  it('produces different coefficients per sample rate', () => {
    expect(kWeightingCoefficients(44100)[0].b0).not.toBeCloseTo(kWeightingCoefficients(48000)[0].b0, 6)
  })
})

// EBU Tech 3341 compliance cases. These are defined as generated signals
// rather than audio files, so they synthesize exactly.
describe.each([48000, 44100])('EBU Tech 3341 @ %ikHz', (sampleRate) => {
  const tone = (dbfs: number, seconds: number) => sine(1000, dbfs, seconds, sampleRate)

  it('case 1: -23 dBFS 1kHz sine reads -23 LUFS', () => {
    expect(measureLoudness(stereo(tone(-23, 20)), sampleRate).lufs).toBeCloseTo(-23, 1)
  })

  it('case 2: -33 dBFS 1kHz sine reads -33 LUFS', () => {
    expect(measureLoudness(stereo(tone(-33, 20)), sampleRate).lufs).toBeCloseTo(-33, 1)
  })

  it('case 3: quiet lead-in/out is excluded by the relative gate', () => {
    const signal = concat(tone(-36, 10), tone(-23, 60), tone(-36, 10))
    expect(measureLoudness(stereo(signal), sampleRate).lufs).toBeCloseTo(-23, 1)
  })

  it('case 4: near-silence is excluded by the absolute gate', () => {
    const signal = concat(tone(-72, 10), tone(-36, 10), tone(-23, 60), tone(-36, 10), tone(-72, 10))
    expect(measureLoudness(stereo(signal), sampleRate).lufs).toBeCloseTo(-23, 1)
  })

  it('case 5: 5.1 channel weights', () => {
    // L/R -28, C -24, Ls/Rs -30 sums to -23 LUFS only if Ls/Rs are weighted 1.41
    const channels = [
      tone(-28, 20), tone(-28, 20), tone(-24, 20),
      silence(20, sampleRate), // LFE, must be excluded entirely
      tone(-30, 20), tone(-30, 20),
    ]

    expect(measureLoudness(channels, sampleRate).lufs).toBeCloseTo(-23, 1)
  })
})

describe('channel handling', () => {
  it('sums across channels rather than averaging', () => {
    // mono is 3 LU quieter than the same content as dual mono. This is correct
    // per BS.1770 and matches ffmpeg/loudgain -- do not "fix" it.
    const mono = measureLoudness([sine(1000, -23, 20)], SR).lufs
    const dual = measureLoudness(stereo(sine(1000, -23, 20)), SR).lufs

    expect(mono).toBeCloseTo(-26, 1)
    expect(dual - mono).toBeCloseTo(3.01, 1)
  })

  it('excludes LFE from the measurement', () => {
    const loud = sine(1000, -6, 20)
    const channels = [silence(20), silence(20), silence(20), loud, silence(20), silence(20)]

    expect(measureLoudness(channels, SR).lufs).toBeNull()
  })

  it('measures only the first two channels of an unmapped layout', () => {
    const tone = sine(1000, -23, 20)
    const three = measureLoudness([tone, Float32Array.from(tone), Float32Array.from(tone)], SR).lufs

    expect(three).toBeCloseTo(measureLoudness(stereo(tone), SR).lufs, 5)
  })
})

describe('sample peak', () => {
  it('is measured before K-weighting', () => {
    // 10kHz sits in the +4dB head shelf; a post-filter peak would read ~0.112
    const { samplePeak } = measureLoudness(stereo(sine(10000, -23, 5)), SR)
    expect(samplePeak).toBeCloseTo(dbfsToAmp(-23), 3)
  })

  it('uses absolute value, not the maximum', () => {
    const data = new Float32Array(SR)
    data[100] = 0.25
    data[200] = -0.8

    expect(measureLoudness([data], SR).samplePeak).toBeCloseTo(0.8, 6)
  })

  it('includes samples in the sub-block remainder', () => {
    const data = new Float32Array(SR + 10)
    data[SR + 5] = 0.9

    expect(measureLoudness([data], SR).samplePeak).toBeCloseTo(0.9, 6)
  })
})

describe('degenerate input', () => {
  it('returns null for a clip shorter than one 400ms block', () => {
    expect(measureLoudness(stereo(sine(1000, -23, 0.1)), SR).lufs).toBeNull()
  })

  it('returns null for digital silence', () => {
    const { lufs, samplePeak } = measureLoudness(stereo(silence(10)), SR)

    expect(lufs).toBeNull()
    expect(samplePeak).toBe(0)
  })

  it('returns null for no channels', () => {
    expect(measureLoudness([], SR).lufs).toBeNull()
  })
})

describe('measureLoudness', () => {
  it('does not modify its input', () => {
    const channels = stereo(sine(1000, -23, 1))
    const before = channels.map(c => Float32Array.from(c))

    measureLoudness(channels, SR)

    expect(channels[0]).toEqual(before[0])
    expect(channels[1]).toEqual(before[1])
  })
})

describe('lufsToTrackGain', () => {
  it('references -18 LUFS', () => {
    expect(lufsToTrackGain(-18)).toBe(0)
    expect(lufsToTrackGain(-23)).toBe(5)
    expect(lufsToTrackGain(-10)).toBe(-8)
  })
})
