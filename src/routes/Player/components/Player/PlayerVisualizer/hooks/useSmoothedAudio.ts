import { useRef, useCallback } from 'react'
import { useAudioData } from '../contexts/AudioDataContext'
import type { AudioData } from './useAudioAnalyser'

/**
 * Smoothed audio data with all numeric values lerped for jitter-free visualization.
 * isBeat remains as raw boolean (no smoothing applied).
 */
export type SmoothedAudioData = AudioData

interface UseSmoothedAudioOptions {
  /** Lerp factor per frame (0-1). Lower = smoother, higher = more responsive. Default: 0.1 */
  lerpFactor?: number
}

/**
 * Linear interpolation
 */
function lerp (current: number, target: number, alpha: number): number {
  return current + (target - current) * alpha
}

/**
 * Hook that provides smoothed audio data for jitter-free visualization.
 * All numeric values are lerped per frame to eliminate visual flickering
 * caused by raw audio data variance.
 *
 * Usage:
 * ```tsx
 * const { getSmoothedAudio } = useSmoothedAudio({ lerpFactor: 0.1 })
 *
 * useFrame(() => {
 *   const audio = getSmoothedAudio()
 *   // audio.bass, audio.energy etc are now smooth
 * })
 * ```
 */
export function useSmoothedAudio (options: UseSmoothedAudioOptions = {}) {
  const { lerpFactor = 0.1 } = options
  const { getAudioData } = useAudioData()

  // Smoothed state refs
  const smoothedRef = useRef<SmoothedAudioData | null>(null)
  const smoothedFreqRef = useRef<Float32Array | null>(null)
  const smoothedWaveRef = useRef<Float32Array | null>(null)

  const getSmoothedAudio = useCallback((): SmoothedAudioData => {
    const raw = getAudioData()

    // Initialize smoothed state if needed
    if (!smoothedRef.current) {
      smoothedFreqRef.current = new Float32Array(raw.frequencyData.length)
      smoothedWaveRef.current = new Float32Array(raw.waveformData.length)

      // Copy initial values
      smoothedFreqRef.current.set(raw.frequencyData)
      smoothedWaveRef.current.set(raw.waveformData)

      smoothedRef.current = {
        ...raw,
        frequencyData: smoothedFreqRef.current,
        waveformData: smoothedWaveRef.current,
      }

      return smoothedRef.current
    }

    const prev = smoothedRef.current
    const smoothedFreq = smoothedFreqRef.current!
    const smoothedWave = smoothedWaveRef.current!

    // Lerp frequency data
    for (let i = 0; i < raw.frequencyData.length; i++) {
      smoothedFreq[i] = lerp(smoothedFreq[i], raw.frequencyData[i], lerpFactor)
    }

    // Lerp waveform data
    for (let i = 0; i < raw.waveformData.length; i++) {
      smoothedWave[i] = lerp(smoothedWave[i], raw.waveformData[i], lerpFactor)
    }

    // Update smoothed values
    smoothedRef.current = {
      rawFrequencyData: raw.rawFrequencyData,
      frequencyData: smoothedFreq,
      waveformData: smoothedWave,
      bass: lerp(prev.bass, raw.bass, lerpFactor),
      mid: lerp(prev.mid, raw.mid, lerpFactor),
      treble: lerp(prev.treble, raw.treble, lerpFactor),
      isBeat: raw.isBeat, // Keep boolean as-is
      beatIntensity: lerp(prev.beatIntensity, raw.beatIntensity, lerpFactor * 4), // Fast decay for beats
      energy: lerp(prev.energy, raw.energy, lerpFactor),
      energySmooth: raw.energySmooth, // Already EMA-smoothed in analyser, no double-smoothing
      spectralCentroid: raw.spectralCentroid, // Already smoothed in analyser, no double-smoothing
      beatFrequency: lerp(prev.beatFrequency, raw.beatFrequency, lerpFactor * 0.5), // Slower for BPM
    }

    return smoothedRef.current
  }, [getAudioData, lerpFactor])

  return { getSmoothedAudio }
}

export default useSmoothedAudio
