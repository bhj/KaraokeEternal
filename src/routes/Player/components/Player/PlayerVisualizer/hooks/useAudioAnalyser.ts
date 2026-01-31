import { useRef, useEffect, useCallback } from 'react'
import type { AudioResponseState } from 'shared/types'
import { AUDIO_RESPONSE_DEFAULTS } from 'shared/types'

export interface AudioData {
  rawFrequencyData: Float32Array // Linear normalized 0-1, 128 bins (for window.a.fft compat)
  frequencyData: Float32Array // Gamma-shaped 0-1, 128 bins (for band globals)
  waveformData: Float32Array // -1 to 1, 256 samples
  bass: number // Low freq average (0-1)
  mid: number // Mid freq average (0-1)
  treble: number // High freq average (0-1)
  isBeat: boolean // Beat detection
  beatIntensity: number // 0-1 strength
  // Energy metrics for genre-responsive visualizers
  energy: number // 0-1 overall energy (RMS of waveform)
  energySmooth: number // Smoothed over ~2 seconds (genre indicator)
  spectralCentroid: number // 0-1 brightness - high for metal, low for ballad
  beatFrequency: number // Estimated BPM (0-1 normalized, 0.5 = 120bpm)
}

interface UseAudioAnalyserOptions {
  fftSize?: number
  smoothingTimeConstant?: number
  sensitivity?: number
  audioResponse?: AudioResponseState
}

export function applyAudioResponseWeights (
  rawFreq: Float32Array,
  gammaFreq: Float32Array,
  bassEnd: number,
  midEnd: number,
  response: AudioResponseState,
): void {
  const g = Number.isFinite(response.globalGain) ? Math.max(0, response.globalGain) : 1
  const bw = Number.isFinite(response.bassWeight) ? Math.max(0, response.bassWeight) : 1
  const mw = Number.isFinite(response.midWeight) ? Math.max(0, response.midWeight) : 1
  const tw = Number.isFinite(response.trebleWeight) ? Math.max(0, response.trebleWeight) : 1
  for (let i = 0; i < rawFreq.length; i++) {
    const w = i < bassEnd ? bw : i < midEnd ? mw : tw
    const scale = g * w
    rawFreq[i] = Math.min(1, Math.max(0, rawFreq[i] * scale))
    gammaFreq[i] = Math.min(1, Math.max(0, gammaFreq[i] * scale))
  }
}

const DEFAULT_FFT_SIZE = 256
const DEFAULT_SMOOTHING = 0.8

/**
 * Gamma exponent applied to frequency data for band globals (bass/mid/treble/etc).
 * Linear data (no gamma) is preserved in rawFrequencyData for window.a.fft compat.
 */
const GAMMA = 0.7

export function useAudioAnalyser (
  audioSourceNode: MediaElementAudioSourceNode | null,
  options: UseAudioAnalyserOptions = {},
) {
  const {
    fftSize = DEFAULT_FFT_SIZE,
    smoothingTimeConstant = DEFAULT_SMOOTHING,
    sensitivity = 1,
    audioResponse,
  } = options

  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const silentGainRef = useRef<GainNode | null>(null)
  const frequencyDataRef = useRef<Float32Array<ArrayBuffer> | null>(null)
  const waveformDataRef = useRef<Float32Array<ArrayBuffer> | null>(null)
  const previousBassRef = useRef<number>(0)
  const beatThresholdRef = useRef<number>(0.15)
  const diagLoggedRef = useRef(false)
  const diagFramesRef = useRef(0)

  // Hz-based band boundaries (computed once per audio source)
  const bassEndRef = useRef<number>(0)
  const midEndRef = useRef<number>(0)

  // Audio response weights (updated on prop change, read in getAudioData)
  const audioResponseRef = useRef<AudioResponseState>(audioResponse ?? AUDIO_RESPONSE_DEFAULTS)
  useEffect(() => {
    audioResponseRef.current = audioResponse ?? AUDIO_RESPONSE_DEFAULTS
  }, [audioResponse])

  // Energy tracking for genre detection
  const energySmoothRef = useRef<number>(0)
  const spectralCentroidSmoothRef = useRef<number>(0)
  const beatTimestampsRef = useRef<number[]>([])
  const lastBeatTimeRef = useRef<number>(0)

  // Initialize analyser when audio source changes
  useEffect(() => {
    if (!audioSourceNode) return

    const audioCtx = audioSourceNode.context

    // Create gain node for sensitivity control
    const gainNode = audioCtx.createGain()
    gainNode.gain.setValueAtTime(sensitivity, audioCtx.currentTime)
    gainNodeRef.current = gainNode

    // Create analyser node
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = fftSize
    analyser.smoothingTimeConstant = smoothingTimeConstant
    analyserRef.current = analyser

    // REQUIRED: source → gain → analyser → silentGain(0) → destination
    // This chain keeps the analyser alive in all browsers (some ignore dead-end nodes)
    audioSourceNode.connect(gainNode)
    gainNode.connect(analyser)

    const silentGain = audioCtx.createGain()
    silentGain.gain.value = 0
    silentGainRef.current = silentGain
    analyser.connect(silentGain)
    silentGain.connect(audioCtx.destination)

    // REQUIRED: resume() ensures analyser receives data on autoplay-restricted browsers
    if (audioCtx.state === 'suspended') {
      const resume = (audioCtx as AudioContext).resume?.bind(audioCtx)
      if (resume) {
        resume().catch(() => {
          // Browser policy may block resume until user gesture
        })
      }
    }

    // Initialize data arrays
    const binCount = analyser.frequencyBinCount
    frequencyDataRef.current = new Float32Array(
      new ArrayBuffer(binCount * Float32Array.BYTES_PER_ELEMENT),
    )
    waveformDataRef.current = new Float32Array(
      new ArrayBuffer(analyser.fftSize * Float32Array.BYTES_PER_ELEMENT),
    )

    // Compute Hz-based band boundaries once per audio source
    // Known limitation: FFT 256 at 44.1kHz gives ~172Hz per bin — coarse for bass.
    // Widened bass to 20-400Hz gives ~2-3 bins. Weighted average smooths it.
    // Can increase FFT to 512 later for better bass resolution.
    const sampleRate = (audioCtx as AudioContext).sampleRate ?? 44100
    const hzPerBin = sampleRate / fftSize
    bassEndRef.current = Math.max(2, Math.round(400 / hzPerBin)) // 20-400Hz
    midEndRef.current = Math.max(bassEndRef.current + 1, Math.round(4000 / hzPerBin)) // 400-4kHz

    return () => {
      // Disconnect nodes on cleanup
      try {
        audioSourceNode.disconnect(gainNode)
        gainNode.disconnect(analyser)
        if (silentGainRef.current) {
          analyser.disconnect(silentGainRef.current)
          silentGainRef.current.disconnect(audioCtx.destination)
          silentGainRef.current = null
        }
      } catch {
        // Nodes may already be disconnected
      }
    }
  }, [audioSourceNode, fftSize, smoothingTimeConstant, sensitivity])

  // Update sensitivity when it changes
  useEffect(() => {
    if (gainNodeRef.current) {
      const audioCtx = gainNodeRef.current.context
      gainNodeRef.current.gain.setValueAtTime(sensitivity, audioCtx.currentTime)
    }
  }, [sensitivity])

  // Function to get current audio data - call this in animation loop
  const getAudioData = useCallback((): AudioData => {
    const analyser = analyserRef.current
    const frequencyData = frequencyDataRef.current
    const waveformData = waveformDataRef.current

    // Return empty data if not initialized
    if (!analyser || !frequencyData || !waveformData) {
      return {
        rawFrequencyData: new Float32Array(64),
        frequencyData: new Float32Array(64),
        waveformData: new Float32Array(128),
        bass: 0,
        mid: 0,
        treble: 0,
        isBeat: false,
        beatIntensity: 0,
        energy: 0,
        energySmooth: 0,
        spectralCentroid: 0.5,
        beatFrequency: 0.5,
      }
    }

    // Get raw frequency data (in dB, typically -100 to 0)
    analyser.getFloatFrequencyData(frequencyData)

    // Get waveform data (-1 to 1)
    analyser.getFloatTimeDomainData(waveformData)

    // Normalize frequency data to 0-1 range (linear)
    const rawNormalizedFreq = new Float32Array(frequencyData.length)
    const gammaFreq = new Float32Array(frequencyData.length)
    for (let i = 0; i < frequencyData.length; i++) {
      // Convert from dB (-100 to 0) to linear (0 to 1)
      const linear = Math.max(
        0,
        Math.min(
          1,
          (frequencyData[i] - analyser.minDecibels)
          / (analyser.maxDecibels - analyser.minDecibels),
        ),
      )
      rawNormalizedFreq[i] = linear
      // Gamma curve for band globals — gentle boost to mid/low amplitudes
      gammaFreq[i] = Math.pow(linear, GAMMA)
    }

    // Hz-based frequency bands
    const binCount = frequencyData.length
    const bassEnd = bassEndRef.current || Math.max(2, Math.floor(binCount * 0.03))
    const midEnd = midEndRef.current || Math.floor(binCount * 0.5)

    // --- UNWEIGHTED pass: bass for beat detection, spectral centroid ---
    let bassUnweightedSum = 0
    for (let i = 0; i < bassEnd; i++) {
      bassUnweightedSum += gammaFreq[i]
    }
    const bassUnweighted = bassUnweightedSum / bassEnd

    // Beat detection (unweighted bass)
    const bassChange = bassUnweighted - previousBassRef.current
    const isBeat = bassChange > beatThresholdRef.current && bassUnweighted > 0.25
    const beatIntensity = isBeat ? Math.min(1, bassChange * 2) : 0
    previousBassRef.current = bassUnweighted
    beatThresholdRef.current = beatThresholdRef.current * 0.95 + 0.05 * 0.15

    // Spectral centroid (unweighted — brightness indicator)
    let weightedSum = 0
    let totalWeight = 0
    for (let i = 0; i < rawNormalizedFreq.length; i++) {
      const weight = rawNormalizedFreq[i]
      weightedSum += i * weight
      totalWeight += weight
    }
    const rawCentroid = totalWeight > 0 ? weightedSum / totalWeight / rawNormalizedFreq.length : 0.5
    spectralCentroidSmoothRef.current = spectralCentroidSmoothRef.current * 0.9 + rawCentroid * 0.1
    const spectralCentroid = spectralCentroidSmoothRef.current

    // Energy (unweighted — waveform RMS, not affected by audio response)
    let sumSquares = 0
    for (let i = 0; i < waveformData.length; i++) {
      sumSquares += waveformData[i] * waveformData[i]
    }
    const energy = Math.sqrt(sumSquares / waveformData.length)

    const energySmoothAlpha = 0.008
    energySmoothRef.current = energySmoothRef.current * (1 - energySmoothAlpha) + energy * energySmoothAlpha
    const energySmooth = energySmoothRef.current

    // Beat frequency estimation (BPM tracking)
    const now = performance.now()
    if (isBeat && now - lastBeatTimeRef.current > 200) {
      beatTimestampsRef.current.push(now)
      lastBeatTimeRef.current = now
      if (beatTimestampsRef.current.length > 16) {
        beatTimestampsRef.current.shift()
      }
    }

    let beatFrequency = 0.5
    const timestamps = beatTimestampsRef.current
    if (timestamps.length >= 4) {
      let totalInterval = 0
      for (let i = 1; i < timestamps.length; i++) {
        totalInterval += timestamps[i] - timestamps[i - 1]
      }
      const avgInterval = totalInterval / (timestamps.length - 1)
      const bpm = 60000 / avgInterval
      beatFrequency = Math.max(0, Math.min(1, (bpm - 60) / 120))
    }

    // --- WEIGHTED pass: apply audio response, then compute band averages for closures ---
    applyAudioResponseWeights(rawNormalizedFreq, gammaFreq, bassEnd, midEnd, audioResponseRef.current)

    let bassSum = 0
    let midSum = 0
    let trebleSum = 0
    for (let i = 0; i < bassEnd; i++) {
      bassSum += gammaFreq[i]
    }
    for (let i = bassEnd; i < midEnd; i++) {
      midSum += gammaFreq[i]
    }
    for (let i = midEnd; i < binCount; i++) {
      trebleSum += gammaFreq[i]
    }

    const bass = bassSum / bassEnd
    const mid = midSum / (midEnd - bassEnd)
    const treble = trebleSum / (binCount - midEnd)

    // Dev-only startup diagnostic — fires after 60 frames for reliability
    // Catches CORS taint and suspended audio contexts
    if (!diagLoggedRef.current) {
      diagFramesRef.current += 1
      if (diagFramesRef.current >= 60) {
        diagLoggedRef.current = true
        const sample = frequencyData[0]
        const ctxState = analyser.context.state
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AudioAnalyser] diag:', {
            sample,
            ctxState,
            bass,
            mid,
            treble,
            energy,
          })
          if (sample === -Infinity) {
            console.warn('[AudioAnalyser] -Infinity frequency data — possible CORS taint or suspended context')
          }
        }
      }
    }

    return {
      rawFrequencyData: rawNormalizedFreq,
      frequencyData: gammaFreq,
      waveformData: new Float32Array(waveformData),
      bass,
      mid,
      treble,
      isBeat,
      beatIntensity,
      energy,
      energySmooth,
      spectralCentroid,
      beatFrequency,
    }
  }, [])

  return { getAudioData }
}

export default useAudioAnalyser
