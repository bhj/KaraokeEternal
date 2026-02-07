import React, { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { useAppSelector } from 'store/hooks'
import { type AudioData } from 'routes/Player/components/Player/PlayerVisualizer/hooks/useAudioAnalyser'
import type { AudioResponseState, VisualizerMode } from 'shared/types'
import HydraVisualizer from '../../Player/components/Player/PlayerVisualizer/HydraVisualizer'
import styles from './HydraPreview.css'

interface HydraPreviewProps {
  code: string
  width: number
  height: number
  localCameraStream?: MediaStream | null
  mode: VisualizerMode
  isEnabled: boolean
  sensitivity: number
  allowCamera: boolean
  audioResponse: AudioResponseState
  onCameraBoundSourcesChange?: (sources: string[]) => void
}

function mapFftToAudioData (fft: { fft: number[], bass: number, mid: number, treble: number, beat: number, energy: number, bpm: number, bright: number }): AudioData {
  return {
    rawFrequencyData: new Float32Array(fft.fft),
    frequencyData: new Float32Array(fft.fft),
    waveformData: new Float32Array(128),
    bass: fft.bass,
    mid: fft.mid,
    treble: fft.treble,
    isBeat: fft.beat > 0.8,
    beatIntensity: fft.beat,
    energy: fft.energy,
    energySmooth: fft.energy,
    spectralCentroid: fft.bright,
    beatFrequency: fft.bpm,
  }
}

const HydraPreview = ({
  code,
  width,
  height,
  localCameraStream,
  mode,
  isEnabled,
  sensitivity,
  allowCamera,
  audioResponse,
  onCameraBoundSourcesChange,
}: HydraPreviewProps) => {
  const status = useAppSelector(state => state.status)
  const isHydraActive = isEnabled && mode === 'hydra'

  const isLive = status.isPlayerPresent && status.fftData !== null
  const overrideData = isLive && status.fftData ? mapFftToAudioData(status.fftData) : null

  const previewVideoElement = useMemo(() => {
    if (!allowCamera || !localCameraStream) {
      return null
    }

    const el = document.createElement('video')
    el.autoplay = true
    el.playsInline = true
    el.muted = true
    el.srcObject = localCameraStream

    return el
  }, [allowCamera, localCameraStream])

  // Use only local camera stream in orchestrator preview.
  // Player owns remote camera subscription to avoid WebRTC answer races.
  useEffect(() => {
    if (!previewVideoElement) {
      return
    }

    const playPromise = previewVideoElement.play()
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((err: unknown): void => {
        console.debug('[HydraPreview] camera preview play() failed', err)
      })
    }

    return () => {
      previewVideoElement.srcObject = null
    }
  }, [previewVideoElement])

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

  useEffect(() => {
    const store = audioStoreRef.current

    if (!isHydraActive) {
      store.source = null
      store.listeners.forEach(listener => listener())
      return
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioCtx()

    const masterGain = ctx.createGain()
    masterGain.gain.value = 0
    masterGain.connect(ctx.destination)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 2

    const oscGain = ctx.createGain()
    oscGain.gain.value = 1.0

    osc.connect(oscGain)
    oscGain.connect(masterGain)
    osc.start()

    store.source = oscGain as unknown as MediaElementAudioSourceNode
    store.listeners.forEach(listener => listener())

    return () => {
      osc.stop()
      store.source = null
      store.listeners.forEach(listener => listener())
      ctx.close()
    }
  }, [isHydraActive])

  const label = !isHydraActive
    ? 'Preview (Visualizer Off)'
    : isLive
      ? 'Preview (Live Audio)'
      : 'Preview (Simulated Audio)'

  return (
    <div className={styles.container} style={{ width, height }}>
      <div className={styles.label}>{label}</div>
      {isHydraActive && (audioSource || isLive) && (
        <HydraVisualizer
          audioSourceNode={isLive ? null : audioSource}
          isPlaying={true}
          sensitivity={sensitivity}
          width={width}
          height={height}
          code={code}
          layer={0}
          audioResponse={audioResponse}
          allowCamera={allowCamera}
          overrideData={overrideData}
          remoteVideoElement={previewVideoElement}
          onCameraSourcesBoundChange={onCameraBoundSourcesChange}
        />
      )}
    </div>
  )
}

export default HydraPreview
