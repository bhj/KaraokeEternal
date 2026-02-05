import React, { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { useAppSelector } from 'store/hooks'
import { type AudioData } from 'routes/Player/components/Player/PlayerVisualizer/hooks/useAudioAnalyser'
import HydraVisualizer from '../../Player/components/Player/PlayerVisualizer/HydraVisualizer'
import styles from './HydraPreview.css'

interface HydraPreviewProps {
  code: string
  width: number
  height: number
}

// Convert FftPayload to AudioData format expected by HydraVisualizer
function mapFftToAudioData (fft: { fft: number[], bass: number, mid: number, treble: number, beat: number, energy: number, bpm: number, bright: number }): AudioData {
  return {
    // Reconstruct full float arrays if needed, but for now just pass what we have.
    // HydraAudioCompat uses rawFrequencyData for fft[], and other props directly.
    // We'll map the payload fft array to rawFrequencyData.
    rawFrequencyData: new Float32Array(fft.fft),
    frequencyData: new Float32Array(fft.fft), // shim
    waveformData: new Float32Array(128), // shim (no waveform in payload yet)
    bass: fft.bass,
    mid: fft.mid,
    treble: fft.treble,
    isBeat: fft.beat > 0.8, // approximate
    beatIntensity: fft.beat,
    energy: fft.energy,
    energySmooth: fft.energy,
    spectralCentroid: fft.bright,
    beatFrequency: fft.bpm,
  }
}

const HydraPreview = ({ code, width, height }: HydraPreviewProps) => {
  const status = useAppSelector(state => state.status)
  const isLive = status.fftData !== null
  const overrideData = status.fftData ? mapFftToAudioData(status.fftData) : null

  // Create a dummy audio source to drive the visualizer
  const audioStoreRef = useRef<{
    source: MediaElementAudioSourceNode | null
    listeners: Set<() => void>
  }>({
    source: null,
    listeners: new Set(),
  })

  const getSnapshot = useCallback(
    () => audioStoreRef.current.source,
    [],
  )
  const getServerSnapshot = useCallback(
    () => null as MediaElementAudioSourceNode | null,
    [],
  )
  const subscribe = useCallback((listener: () => void) => {
    const store = audioStoreRef.current
    store.listeners.add(listener)
    return () => store.listeners.delete(listener)
  }, [])

  const audioSource = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  useEffect(() => {
    // Setup a simulated audio beat for preview
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioCtx()
    audioCtxRef.current = ctx

    // Create a destination that doesn't actually output to speakers (gain 0)
    // but drives the analyser
    const masterGain = ctx.createGain()
    masterGain.gain.value = 0 // Mute simulated audio
    masterGain.connect(ctx.destination)

    // Oscillator to simulate "bass" / beat
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 2 // 120 BPM-ish throb

    // VCA for the oscillator
    const oscGain = ctx.createGain()
    oscGain.gain.value = 1.0

    osc.connect(oscGain)
    oscGain.connect(masterGain)
    osc.start()

    oscRef.current = osc
    gainRef.current = oscGain

    // We need a MediaElementSourceNode to satisfy the prop type,
    // BUT our visualizer hook uses `createAnalyser` from the context.
    // The current `useAudioAnalyser` takes `MediaElementAudioSourceNode`.
    // We might need to mock that object or cast a regular node if the hook only checks `.context`.

    // Hack: The hook uses `audioSourceNode.context`.
    // It calls `audioSourceNode.connect(gainNode)`.
    // A regular GainNode works for this signature compatibility in standard WebAudio,
    // but the type is specific.

    // Let's rely on the fact that `useAudioAnalyser` just calls `.connect` and `.context`.
    // We'll cast `oscGain` to `any` -> `MediaElementAudioSourceNode`
    // since we know the hook essentially treats it as an AudioNode.
    const store = audioStoreRef.current
    store.source = oscGain as unknown as MediaElementAudioSourceNode
    store.listeners.forEach(listener => listener())

    return () => {
      osc.stop()
      store.source = null
      store.listeners.forEach(listener => listener())
      ctx.close()
    }
  }, [])

  return (
    <div className={styles.container} style={{ width, height }}>
      <div className={styles.label}>
        {isLive ? 'Preview (Live Audio)' : 'Preview (Simulated Audio)'}
      </div>
      {(audioSource || isLive) && (
        <HydraVisualizer
          audioSourceNode={isLive ? null : audioSource}
          isPlaying={true}
          sensitivity={1}
          width={width}
          height={height}
          code={code}
          layer={0}
          overrideData={overrideData}
        />
      )}
    </div>
  )
}

export default HydraPreview
