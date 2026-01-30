/**
 * Hydra-native audio compatibility layer.
 *
 * Implements `window.a` with `a.fft[0..N]`, `a.setBins(n)`, `a.setSmooth(v)`,
 * `a.setScale(v)` so gallery sketches using `a.fft[0]` work unmodified.
 *
 * Data source: `rawFrequencyData` (linear normalized 0-1, no gamma).
 * Legacy Hydra sketches expect linear FFT data from `a.fft[]`.
 * Gamma-shaped data is reserved for our custom band globals (bass/mid/treble/etc).
 *
 * Known limitation: 256 FFT at 44.1kHz gives ~172Hz per bin — coarse for bass.
 * Can increase to 512 later if needed (doubles bins, halves time resolution).
 */

/** Minimal audio data contract needed by the compat layer */
export interface AudioDataForCompat {
  rawFrequencyData: Float32Array
}

export interface HydraAudioCompat {
  fft: number[]
  setBins: (n: number) => void
  setSmooth: (v: number) => void
  setScale: (v: number) => void
  update: (audioData: AudioDataForCompat) => void
}

const MIN_BINS = 2
const MAX_BINS = 64
const MAX_SCALE = 3
const DEFAULT_BINS = 4
const DEFAULT_SMOOTH = 0.4 // Hydra default smoothing
const DEFAULT_SCALE = 1

export function createHydraAudioCompat (): HydraAudioCompat {
  let bins = DEFAULT_BINS
  let smooth = DEFAULT_SMOOTH
  let scale = DEFAULT_SCALE
  let fft: number[] = new Array(bins).fill(0)
  let prev: number[] = new Array(bins).fill(0)

  const compat: HydraAudioCompat = {
    fft,

    setBins (n: number) {
      const clamped = Math.max(MIN_BINS, Math.min(MAX_BINS, Math.round(n)))
      if (clamped === bins) return // no-op — avoid per-frame reallocation
      bins = clamped
      fft = new Array(bins).fill(0)
      prev = new Array(bins).fill(0)
      compat.fft = fft
    },

    setSmooth (v: number) {
      smooth = Math.max(0, Math.min(1, v))
    },

    setScale (v: number) {
      scale = Math.max(0, Math.min(MAX_SCALE, v))
    },

    update (audioData: AudioDataForCompat) {
      const raw = audioData.rawFrequencyData
      if (!raw || raw.length === 0) return

      const binCount = raw.length
      for (let i = 0; i < bins; i++) {
        // Sample evenly across the frequency range
        const idx = Math.min(
          binCount - 1,
          Math.round((i / bins) * binCount + binCount / (2 * bins)),
        )
        let value = raw[idx] * scale

        // Apply per-bin EMA smoothing (independent from analyser's smoothingTimeConstant)
        value = prev[i] * smooth + value * (1 - smooth)

        // Clamp to [0, 1]
        value = Math.max(0, Math.min(1, value))

        fft[i] = value
        prev[i] = value
      }
    },
  }

  return compat
}
