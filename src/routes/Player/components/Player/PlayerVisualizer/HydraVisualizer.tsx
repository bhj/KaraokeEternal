import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import Hydra from 'hydra-synth'
import throttle from 'lodash/throttle'
import { useDispatch } from 'react-redux'
import { PLAYER_EMIT_FFT } from 'shared/actionTypes'
import { type AudioData } from './hooks/useAudioAnalyser'
import { useHydraAudio } from './hooks/useHydraAudio'
import { getHydraEvalCode, DEFAULT_PATCH } from './hydraEvalCode'
import { detectCameraUsage } from 'lib/detectCameraUsage'
import { applyRemoteCameraOverride, restoreRemoteCameraOverride } from 'lib/remoteCameraOverride'
import { shouldEmitFft } from './hooks/emitFftPolicy'
import type { HydraAudioCompat } from './hooks/hydraAudioCompat'
import type { AudioResponseState } from 'shared/types'
import styles from './HydraVisualizer.css'

const log = (...args: unknown[]) => console.log('[Hydra]', ...args)
const warn = (...args: unknown[]) => console.warn('[Hydra]', ...args)

// Audio globals exposed on window for Hydra code to reference
function setAudioGlobals (compat: HydraAudioCompat) {
  const w = window as unknown as Record<string, unknown>
  w.a = compat
}

function clearAudioGlobals () {
  const w = window as unknown as Record<string, unknown>
  // Defensive cleanup for sessions that previously exposed legacy helpers.
  delete w.bass
  delete w.mid
  delete w.treble
  delete w.beat
  delete w.energy
  delete w.bpm
  delete w.bright
  delete w.a
}

function executeHydraCode (hydra: Hydra, code: string) {
  try {
    hydra.eval(getHydraEvalCode(code))
  } catch (err) {
    warn('Code execution error:', err)
    // Don't crash — keep last working frame
  }
}

interface HydraVisualizerProps {
  audioSourceNode: MediaElementAudioSourceNode | null
  isPlaying: boolean
  sensitivity: number
  width: number
  height: number
  /** Hydra code to execute. If not provided, uses default patch. */
  code?: string
  /** Override container z-index for previews or overlays. */
  layer?: number
  audioResponse?: AudioResponseState
  /** When true, auto-init camera for detected source usage */
  allowCamera?: boolean
  /** When true, emit FFT data to server for remote preview */
  emitFft?: boolean
  /** Remote audio data to drive visualizer (replaces audioSourceNode) */
  overrideData?: AudioData | null
  /** Remote camera video element from WebRTC (replaces local initCam) */
  remoteVideoElement?: HTMLVideoElement | null
}

function HydraVisualizer ({
  audioSourceNode,
  isPlaying,
  sensitivity,
  width,
  height,
  code,
  layer,
  audioResponse,
  allowCamera,
  emitFft,
  overrideData,
  remoteVideoElement,
}: HydraVisualizerProps) {
  const dispatch = useDispatch()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hydraRef = useRef<Hydra | null>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const errorCountRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const widthRef = useRef(width)
  const heightRef = useRef(height)
  const codeRef = useRef(code)
  const cameraInitRef = useRef<Set<string>>(new Set())
  const cameraOverrideRef = useRef<Map<string, unknown>>(new Map())

  const { update: updateAudio, compat, audioRef } = useHydraAudio(
    audioSourceNode,
    sensitivity,
    audioResponse,
    overrideData,
  )

  // Throttle FFT emission to ~20Hz (50ms)
  const emitFftData = useMemo(() => throttle((data: AudioData) => {
    // Send a condensed payload to save bandwidth
    const payload = {
      fft: Array.from(compat.fft), // Use the downsampled/smoothed FFT from compat
      bass: data.bass,
      mid: data.mid,
      treble: data.treble,
      beat: data.beatIntensity,
      energy: data.energy,
      bpm: data.beatFrequency,
      bright: data.spectralCentroid,
    }

    dispatch({
      type: PLAYER_EMIT_FFT,
      payload,
      meta: { throttle: { wait: 50, leading: false } },
    })
  }, 50, { leading: false, trailing: true }), [dispatch, compat])

  useEffect(() => {
    return () => {
      emitFftData.cancel()
    }
  }, [emitFftData])

  useEffect(() => {
    widthRef.current = width
    heightRef.current = height
    codeRef.current = code
  }, [width, height, code])

  // Override initCam() to use remote video when present
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>
    const sources = ['s0', 's1', 's2', 's3']

    if (remoteVideoElement) {
      applyRemoteCameraOverride(sources, remoteVideoElement, w, cameraOverrideRef.current)
    } else {
      restoreRemoteCameraOverride(w, cameraOverrideRef.current)
    }
  }, [remoteVideoElement])

  // Set window.a compat on window so Hydra code can reference a.fft and controls
  useEffect(() => {
    setAudioGlobals(compat)
    return () => clearAudioGlobals()
  }, [compat])

  // Initialize Hydra (mount-only)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    log('Initializing')

    let hydra: Hydra
    try {
      hydra = new Hydra({
        canvas,
        width: widthRef.current,
        height: heightRef.current,
        detectAudio: false,
        makeGlobal: true,
        autoLoop: false,
        precision: 'mediump',
      })
    } catch (err) {
      warn('Failed to initialize:', err)
      return
    }

    hydraRef.current = hydra
    errorCountRef.current = 0

    // Execute initial patch and render first frame immediately
    executeHydraCode(hydra, getHydraEvalCode(codeRef.current))
    hydra.tick(16.67)

    return () => {
      log('Destroying')
      cancelAnimationFrame(rafRef.current)
      try {
        hydra.regl.destroy()
      } catch {
        // WebGL context may already be lost
      }
      hydraRef.current = null
    }
  }, []) // mount-only — resize handled separately

  // Resize without recreating WebGL context
  useEffect(() => {
    const hydra = hydraRef.current
    if (!hydra) return
    hydra.setResolution(width, height)
  }, [width, height])

  // Camera auto-init: when allowCamera flips true, init camera for detected sources
  // Uses remote WebRTC video when available, falls back to local initCam()
  useEffect(() => {
    if (!allowCamera && !remoteVideoElement) {
      cameraInitRef.current.clear()
      return
    }

    const currentCode = getHydraEvalCode(codeRef.current)
    const { sources } = detectCameraUsage(currentCode)
    const w = window as unknown as Record<string, unknown>

    for (const src of sources) {
      if (cameraInitRef.current.has(src)) continue
      const extSrc = w[src] as { initCam?: (index?: number) => void, init?: (opts: { src: HTMLVideoElement }) => void } | undefined
      if (!extSrc) continue
      try {
        if (remoteVideoElement && extSrc.init) {
          extSrc.init({ src: remoteVideoElement })
          cameraInitRef.current.add(src)
        } else if (allowCamera && extSrc.initCam) {
          extSrc.initCam()
          cameraInitRef.current.add(src)
        }
      } catch (err) {
        warn('Camera init failed for', src, err)
      }
    }
  }, [allowCamera, remoteVideoElement])

  // Re-execute code when it changes
  useEffect(() => {
    const hydra = hydraRef.current
    if (!hydra) return

    // Re-check camera init when code changes with camera enabled
    if (allowCamera || remoteVideoElement) {
      const { sources } = detectCameraUsage(getHydraEvalCode(code))
      const w = window as unknown as Record<string, unknown>
      for (const src of sources) {
        if (cameraInitRef.current.has(src)) continue
        const extSrc = w[src] as { initCam?: (index?: number) => void, init?: (opts: { src: HTMLVideoElement }) => void } | undefined
        if (!extSrc) continue
        try {
          if (remoteVideoElement && extSrc.init) {
            extSrc.init({ src: remoteVideoElement })
            cameraInitRef.current.add(src)
          } else if (allowCamera && extSrc.initCam) {
            extSrc.initCam()
            cameraInitRef.current.add(src)
          }
        } catch (err) {
          warn('Camera init failed for', src, err)
        }
      }
    }

    executeHydraCode(hydra, getHydraEvalCode(code))
    errorCountRef.current = 0
  }, [code, allowCamera, remoteVideoElement])

  // Animation tick
  const tick = useCallback((time: number) => {
    const hydra = hydraRef.current
    if (!hydra) return

    // Update audio data from analyser
    updateAudio()

    // Emit FFT if enabled (always emit while Hydra is running)
    if (emitFft && shouldEmitFft(isPlaying)) {
      emitFftData(audioRef.current)
    }

    // Calculate delta time in milliseconds
    const dt = lastTimeRef.current ? time - lastTimeRef.current : 16.67
    lastTimeRef.current = time

    try {
      hydra.tick(dt)
    } catch (err) {
      errorCountRef.current++
      if (errorCountRef.current <= 3) {
        warn('Tick error:', err)
      }
      if (errorCountRef.current === 10) {
        warn('Too many errors, re-applying default patch')
        executeHydraCode(hydra, DEFAULT_PATCH)
        errorCountRef.current = 0
      }
    }

    frameCountRef.current += 1
    if (process.env.NODE_ENV !== 'production' && frameCountRef.current % 120 === 1) {
      const w = window as unknown as Record<string, unknown>
      const bassFn = w.bass
      const bassValue = typeof bassFn === 'function' ? (bassFn as () => number)() : 'unset'
      console.log('[Hydra] audio sample:', { bass: bassValue })
    }
  }, [updateAudio, emitFft, isPlaying, emitFftData, audioRef])

  // Start/stop animation based on isPlaying
  useEffect(() => {
    if (isPlaying && hydraRef.current) {
      lastTimeRef.current = 0
      const frame = (time: number) => {
        tick(time)
        rafRef.current = requestAnimationFrame(frame)
      }
      rafRef.current = requestAnimationFrame(frame)
    } else {
      cancelAnimationFrame(rafRef.current)
    }

    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, tick])

  const containerStyle: React.CSSProperties = { width, height }
  if (typeof layer === 'number') {
    containerStyle.zIndex = layer
  }

  return (
    <div className={styles.container} style={containerStyle}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={width}
        height={height}
      />
    </div>
  )
}

// Error boundary wrapper
interface ErrorBoundaryState {
  hasError: boolean
}

class HydraErrorBoundary extends React.Component<
  { children: React.ReactNode, width: number, height: number, layer?: number },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null

  static getDerivedStateFromError (): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch (error: Error) {
    warn('Error boundary caught:', error.message)
    // Auto-recover after 2 seconds
    this.recoveryTimer = setTimeout(() => {
      this.setState({ hasError: false })
    }, 2000)
  }

  componentWillUnmount () {
    if (this.recoveryTimer) clearTimeout(this.recoveryTimer)
  }

  render () {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: this.props.width,
            height: this.props.height,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: typeof this.props.layer === 'number' ? this.props.layer : -1,
          }}
        />
      )
    }
    return this.props.children
  }
}

// Wrapped export with error boundary
function HydraVisualizerWithBoundary (props: HydraVisualizerProps) {
  return (
    <HydraErrorBoundary width={props.width} height={props.height} layer={props.layer}>
      <HydraVisualizer {...props} />
    </HydraErrorBoundary>
  )
}

export default HydraVisualizerWithBoundary
