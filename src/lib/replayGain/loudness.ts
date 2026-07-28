/**
 * ITU-R BS.1770-4 integrated loudness and sample peak.
 *
 * TEMPORARY: the DSP behind ./bespoke, which stands in for
 * @audio/loudness-replaygain until our changes to it are published. See
 * measure.ts.
 *
 * Deliberately dependency-free and free of any Web Audio reference so it can
 * be unit tested under vitest, which runs in node with no AudioContext.
 */

// ReplayGain 2.0 reference level
export const REFERENCE_LUFS = -18

// BS.1770 mean-square to LKFS offset
const LUFS_OFFSET = -0.691

// absolute gate (LUFS) and the relative gate's offset below the ungated mean (LU)
const ABSOLUTE_GATE = -70
const RELATIVE_GATE = -10

export const lufsToTrackGain = (lufs: number) => REFERENCE_LUFS - lufs

interface Biquad {
  b0: number
  b1: number
  b2: number
  a1: number
  a2: number
}

/**
 * K-weighting filter coefficients for an arbitrary sample rate, via bilinear
 * transform of the analog prototypes. The spec only publishes a 48 kHz table,
 * but 44.1 kHz is the common case for MP3, so derive rather than hardcode.
 */
export function kWeightingCoefficients (sampleRate: number): [Biquad, Biquad] {
  // stage 1: head shelf
  const K1 = Math.tan(Math.PI * 1681.974450955533 / sampleRate)
  const Q1 = 0.7071752369554196
  const Vh = 10 ** (3.999843853973347 / 20)
  const Vb = Vh ** 0.4996667741545416
  const d1 = 1 + K1 / Q1 + K1 * K1

  // stage 2: RLB high-pass
  const K2 = Math.tan(Math.PI * 38.13547087602444 / sampleRate)
  const Q2 = 0.5003270373238773
  const d2 = 1 + K2 / Q2 + K2 * K2

  return [
    {
      b0: (Vh + Vb * K1 / Q1 + K1 * K1) / d1,
      b1: 2 * (K1 * K1 - Vh) / d1,
      b2: (Vh - Vb * K1 / Q1 + K1 * K1) / d1,
      a1: 2 * (K1 * K1 - 1) / d1,
      a2: (1 - K1 / Q1 + K1 * K1) / d1,
    },
    {
      b0: 1,
      b1: -2,
      b2: 1,
      a1: 2 * (K2 * K2 - 1) / d2,
      a2: (1 - K2 / Q2 + K2 * K2) / d2,
    },
  ]
}

/**
 * Per-channel weights, indexed by Web Audio's channel ordering for each
 * layout. Surround channels count for more; LFE is excluded entirely.
 */
function channelWeights (count: number): Float64Array {
  const g = new Float64Array(count)

  switch (count) {
    case 1: // mono
      g[0] = 1
      break
    case 2: // L R
      g[0] = g[1] = 1
      break
    case 4: // L R SL SR
      g[0] = g[1] = 1
      g[2] = g[3] = 1.41
      break
    case 6: // L R C LFE SL SR
      g[0] = g[1] = g[2] = 1
      g[4] = g[5] = 1.41
      break
    default: // unmapped layout; measure the first two channels and ignore the rest
      for (let i = 0; i < Math.min(count, 2); i++) g[i] = 1
  }

  return g
}

/**
 * Integrated loudness (LUFS) and sample peak (linear, 0..n) of decoded PCM.
 *
 * `channels` is not modified: the K-weighted signal is only ever summed, never
 * stored, so no copy of the input is made either.
 *
 * Returns lufs === null when nothing is measurable — a clip shorter than one
 * 400ms block, digital silence, or a decode that yielded all zeros. Callers
 * must treat that as "no value", not as a number.
 */
export function measureLoudness (
  channels: Float32Array[],
  sampleRate: number,
): { lufs: number | null, samplePeak: number } {
  const [s1, s2] = kWeightingCoefficients(sampleRate)
  const weights = channelWeights(channels.length)
  const length = channels[0]?.length ?? 0

  // 400ms blocks overlapping by 75%. Summing each 100ms sub-block once and
  // adding four consecutive sub-blocks per block avoids re-summing every
  // sample four times.
  const subBlockSize = Math.round(sampleRate / 10)
  const blockSize = subBlockSize * 4
  const numSubBlocks = Math.floor(length / subBlockSize)
  const numBlocks = Math.max(0, numSubBlocks - 3)

  let samplePeak = 0

  // weighted mean-square energy per block, summed across channels
  const energy = new Float64Array(numBlocks)

  for (let ch = 0; ch < channels.length; ch++) {
    const data = channels[ch]
    const weight = weights[ch]
    const subSums = new Float64Array(numSubBlocks)

    // stage 1 delay line
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0
    // stage 2 delay line
    let u1 = 0, u2 = 0, v1 = 0, v2 = 0

    let i = 0

    for (let s = 0; s < numSubBlocks; s++) {
      const end = i + subBlockSize
      let acc = 0

      for (; i < end; i++) {
        const x = data[i]

        // peak is of the source signal, before K-weighting; the head shelf
        // adds up to 4dB and would otherwise inflate it
        const mag = x < 0 ? -x : x
        if (mag > samplePeak) samplePeak = mag

        const y = s1.b0 * x + s1.b1 * x1 + s1.b2 * x2 - s1.a1 * y1 - s1.a2 * y2
        const v = y - 2 * u1 + u2 - s2.a1 * v1 - s2.a2 * v2

        x2 = x1
        x1 = x
        y2 = y1
        y1 = y
        u2 = u1
        u1 = y
        v2 = v1
        v1 = v

        acc += v * v
      }

      subSums[s] = acc
    }

    // tail below one sub-block still counts toward peak
    for (; i < length; i++) {
      const mag = data[i] < 0 ? -data[i] : data[i]
      if (mag > samplePeak) samplePeak = mag
    }

    if (weight === 0) continue

    for (let j = 0; j < numBlocks; j++) {
      energy[j] += weight * (subSums[j] + subSums[j + 1] + subSums[j + 2] + subSums[j + 3]) / blockSize
    }
  }

  if (!numBlocks) return { lufs: null, samplePeak }

  // both gates compare block loudness, but comparing energy directly avoids a
  // log per block
  const absoluteThreshold = 10 ** ((ABSOLUTE_GATE - LUFS_OFFSET) / 10)
  let absoluteSum = 0
  let absoluteCount = 0

  for (let j = 0; j < numBlocks; j++) {
    if (energy[j] > absoluteThreshold) {
      absoluteSum += energy[j]
      absoluteCount++
    }
  }

  if (!absoluteCount) return { lufs: null, samplePeak }

  // relative gate is 10 LU below the mean energy of the absolutely-gated set
  const relativeThreshold = (absoluteSum / absoluteCount) * 10 ** (RELATIVE_GATE / 10)
  let gatedSum = 0
  let gatedCount = 0

  for (let j = 0; j < numBlocks; j++) {
    if (energy[j] > absoluteThreshold && energy[j] > relativeThreshold) {
      gatedSum += energy[j]
      gatedCount++
    }
  }

  if (!gatedCount) return { lufs: null, samplePeak }

  return {
    lufs: LUFS_OFFSET + 10 * Math.log10(gatedSum / gatedCount),
    samplePeak,
  }
}
