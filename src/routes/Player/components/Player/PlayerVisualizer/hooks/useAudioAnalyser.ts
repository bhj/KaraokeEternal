import { useRef, useEffect, useCallback } from 'react'

export interface AudioData {
  frequencyData: Float32Array // 0-1 normalized, 128 bins
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
}

const DEFAULT_FFT_SIZE = 256
const DEFAULT_SMOOTHING = 0.8

export function useAudioAnalyser (
  audioSourceNode: MediaElementAudioSourceNode | null,
  options: UseAudioAnalyserOptions = {},
) {
  const {
    fftSize = DEFAULT_FFT_SIZE,
    smoothingTimeConstant = DEFAULT_SMOOTHING,
    sensitivity = 1,
  } = options

  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const frequencyDataRef = useRef<Float32Array | null>(null)
  const waveformDataRef = useRef<Float32Array | null>(null)
  const previousBassRef = useRef<number>(0)
  const beatThresholdRef = useRef<number>(0.3)

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

    // Connect: source -> gain -> analyser
    // Note: We don't connect analyser to destination - it just monitors
    audioSourceNode.connect(gainNode)
    gainNode.connect(analyser)

    // Initialize data arrays
    const binCount = analyser.frequencyBinCount
    frequencyDataRef.current = new Float32Array(binCount)
    waveformDataRef.current = new Float32Array(analyser.fftSize)

    return () => {
      // Disconnect nodes on cleanup
      try {
        audioSourceNode.disconnect(gainNode)
        gainNode.disconnect(analyser)
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

    // Normalize frequency data to 0-1 range
    const normalizedFreq = new Float32Array(frequencyData.length)
    for (let i = 0; i < frequencyData.length; i++) {
      // Convert from dB (-100 to 0) to linear (0 to 1)
      // -100dB = 0, 0dB = 1
      normalizedFreq[i] = Math.max(0, Math.min(1, (frequencyData[i] + 100) / 100))
    }

    // Calculate frequency bands
    const binCount = frequencyData.length
    const bassEnd = Math.floor(binCount * 0.15) // ~0-300Hz at 44.1kHz
    const midEnd = Math.floor(binCount * 0.5) // ~300-2000Hz

    let bassSum = 0
    let midSum = 0
    let trebleSum = 0

    for (let i = 0; i < bassEnd; i++) {
      bassSum += normalizedFreq[i]
    }
    for (let i = bassEnd; i < midEnd; i++) {
      midSum += normalizedFreq[i]
    }
    for (let i = midEnd; i < binCount; i++) {
      trebleSum += normalizedFreq[i]
    }

    const bass = bassSum / bassEnd
    const mid = midSum / (midEnd - bassEnd)
    const treble = trebleSum / (binCount - midEnd)

    // Simple beat detection based on bass spike
    const bassChange = bass - previousBassRef.current
    const isBeat = bassChange > beatThresholdRef.current && bass > 0.4
    const beatIntensity = isBeat ? Math.min(1, bassChange * 2) : 0

    // Update previous bass for next frame
    previousBassRef.current = bass

    // Adaptive beat threshold
    beatThresholdRef.current = beatThresholdRef.current * 0.95 + 0.05 * 0.3

    // --- Energy Detection for Genre Response ---

    // Calculate RMS energy from waveform (instant loudness)
    let sumSquares = 0
    for (let i = 0; i < waveformData.length; i++) {
      sumSquares += waveformData[i] * waveformData[i]
    }
    const energy = Math.sqrt(sumSquares / waveformData.length)

    // Exponential moving average for energy smoothing (~2 second window at 60fps)
    // Alpha ~= 1 - e^(-1/(fps*seconds)) ≈ 0.008 for 2s at 60fps
    const energySmoothAlpha = 0.008
    energySmoothRef.current = energySmoothRef.current * (1 - energySmoothAlpha) + energy * energySmoothAlpha
    const energySmooth = energySmoothRef.current

    // Calculate spectral centroid (brightness indicator)
    // Weighted average of frequencies - higher = brighter/harsher sound
    let weightedSum = 0
    let totalWeight = 0
    for (let i = 0; i < normalizedFreq.length; i++) {
      const weight = normalizedFreq[i]
      weightedSum += i * weight
      totalWeight += weight
    }
    const rawCentroid = totalWeight > 0 ? weightedSum / totalWeight / normalizedFreq.length : 0.5
    // Smooth the spectral centroid
    spectralCentroidSmoothRef.current = spectralCentroidSmoothRef.current * 0.9 + rawCentroid * 0.1
    const spectralCentroid = spectralCentroidSmoothRef.current

    // Beat frequency estimation (BPM tracking)
    const now = performance.now()
    if (isBeat && now - lastBeatTimeRef.current > 200) { // Minimum 200ms between beats (300 BPM max)
      beatTimestampsRef.current.push(now)
      lastBeatTimeRef.current = now

      // Keep only last 16 beats for BPM calculation
      if (beatTimestampsRef.current.length > 16) {
        beatTimestampsRef.current.shift()
      }
    }

    // Calculate BPM from beat intervals
    let beatFrequency = 0.5 // Default to mid-range
    const timestamps = beatTimestampsRef.current
    if (timestamps.length >= 4) {
      let totalInterval = 0
      for (let i = 1; i < timestamps.length; i++) {
        totalInterval += timestamps[i] - timestamps[i - 1]
      }
      const avgInterval = totalInterval / (timestamps.length - 1)
      const bpm = 60000 / avgInterval
      // Normalize BPM to 0-1 range: 60 BPM = 0, 120 BPM = 0.5, 180 BPM = 1
      beatFrequency = Math.max(0, Math.min(1, (bpm - 60) / 120))
    }

    return {
      frequencyData: normalizedFreq,
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
