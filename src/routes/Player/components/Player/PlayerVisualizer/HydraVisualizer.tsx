import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react'
import Hydra from 'hydra-synth'
import throttle from 'lodash/throttle'
import { useDispatch } from 'react-redux'
import { PLAYER_EMIT_FFT } from 'shared/actionTypes'
import { type AudioData } from './hooks/useAudioAnalyser'
import { useHydraAudio } from './hooks/useHydraAudio'
import { getHydraEvalCode, DEFAULT_PATCH } from './hydraEvalCode'
import { detectCameraUsage } from 'lib/detectCameraUsage'
import { applyRemoteCameraOverride, restoreRemoteCameraOverride } from 'lib/remoteCameraOverride'
import { applyVideoProxyOverride, restoreVideoProxyOverride } from 'lib/videoProxyOverride'
import { shouldEmitFft } from './hooks/emitFftPolicy'
import type { HydraAudioCompat } from './hooks/hydraAudioCompat'
import styles from './HydraVisualizer.css'

const log = (...args: unknown[]) => console.log('[Hydra]', ...args)
const warn = (...args: unknown[]) => console.warn('[Hydra]', ...args)
const cameraDiag = (...args: unknown[]) => console.debug('[HydraCameraDiag]', ...args)

function snapshotVideoElement (videoEl: HTMLVideoElement | null) {
  if (!videoEl) return null
  return {
    readyState: videoEl.readyState,
    networkState: videoEl.networkState,
    paused: videoEl.paused,
    muted: videoEl.muted,
    videoWidth: videoEl.videoWidth,
    videoHeight: videoEl.videoHeight,
    hasSrcObject: videoEl.srcObject !== null,
  }
}

function isRemoteVideoRenderable (videoEl: HTMLVideoElement | null) {
  if (!videoEl) return false
  return videoEl.readyState >= 2
    && videoEl.videoWidth > 0
    && videoEl.videoHeight > 0
}

// Audio globals exposed on window for Hydra code to reference
function setAudioGlobals (compat: HydraAudioCompat) {
  const w = window as unknown as Record<string, unknown>
  w.a = compat
}

// Self-healing guard: re-set window.a if it was clobbered (e.g. by hush/eval cycle)
function ensureAudioGlobals (compat: HydraAudioCompat) {
  const w = window as unknown as Record<string, unknown>
  const current = w.a as HydraAudioCompat | undefined
  if (!current || !current.fft || current !== compat) {
    w.a = compat
  }
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

// Clear render graph outputs without clearing sources (preserves WebRTC video tracks).
// Mirrors hydra.hush() output logic (solid black to all outputs) but skips
// source.clear() which calls track.stop() and kills WebRTC streams.
function softHush (hydra: Hydra) {
  const h = hydra as unknown as {
    o?: unknown[]
    synth?: { solid: (r: number, g: number, b: number, a: number) => { out: (o: unknown) => void }, render: (o: unknown) => void }
  }
  if (h.o && h.synth) {
    h.o.forEach(output => h.synth!.solid(0, 0, 0, 0).out(output))
    h.synth.render(h.o[0])
  }
}

function executeHydraCode (hydra: Hydra, code: string, compat?: HydraAudioCompat) {
  try {
    if (compat) ensureAudioGlobals(compat)
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
  /** When true, auto-init camera for detected source usage */
  allowCamera?: boolean
  /** When true, emit FFT data to server for remote preview */
  emitFft?: boolean
  /** Remote audio data to drive visualizer (replaces audioSourceNode) */
  overrideData?: AudioData | null
  /** Remote camera video element from WebRTC (replaces local initCam) */
  remoteVideoElement?: HTMLVideoElement | null
  /** Emits currently bound camera sources (s0-s3) after init/rebind passes */
  onCameraSourcesBoundChange?: (sources: string[]) => void
}

function HydraVisualizer ({
  audioSourceNode,
  isPlaying,
  sensitivity,
  width,
  height,
  code,
  layer,
  allowCamera,
  emitFft,
  overrideData,
  remoteVideoElement,
  onCameraSourcesBoundChange,
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
  const videoProxyOverrideRef = useRef<Map<string, unknown>>(new Map())
  const prevRemoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const compatRef = useRef<HydraAudioCompat | null>(null)
  const [remoteVideoEpoch, setRemoteVideoEpoch] = useState(0)

  const reportCameraSourcesBound = useCallback(() => {
    if (!onCameraSourcesBoundChange) return
    const bound = Array.from(cameraInitRef.current).sort()
    onCameraSourcesBoundChange(bound)
  }, [onCameraSourcesBoundChange])

  const pruneStaleCameraBindings = useCallback((sources: string[]) => {
    const activeSources = new Set(sources)
    for (const src of Array.from(cameraInitRef.current)) {
      if (!activeSources.has(src)) {
        cameraInitRef.current.delete(src)
      }
    }
  }, [])

  const { update: updateAudio, compat, audioRef } = useHydraAudio(
    audioSourceNode,
    sensitivity,
    overrideData,
  )
  compatRef.current = compat

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
    const previousRemote = prevRemoteVideoRef.current
    const nextRemote = remoteVideoElement ?? null

    if (previousRemote !== nextRemote) {
      cameraDiag('remote video element changed', {
        hadPreviousRemote: Boolean(previousRemote),
        hasNextRemote: Boolean(nextRemote),
        nextRemote: snapshotVideoElement(nextRemote),
      })
      cameraInitRef.current.clear()
      reportCameraSourcesBound()
    }

    if (nextRemote) {
      cameraDiag('applyRemoteCameraOverride', snapshotVideoElement(nextRemote))
      applyRemoteCameraOverride(sources, nextRemote, w, cameraOverrideRef.current)
    } else {
      cameraDiag('restoreRemoteCameraOverride')
      restoreRemoteCameraOverride(w, cameraOverrideRef.current)
    }

    prevRemoteVideoRef.current = nextRemote
  }, [remoteVideoElement, reportCameraSourcesBound])

  // Remote video lifecycle diagnostics to chase black-screen conditions.
  useEffect(() => {
    if (!remoteVideoElement) return

    const events = ['loadedmetadata', 'canplay', 'playing', 'waiting', 'stalled', 'ended', 'error'] as const
    const handlers = events.map((eventName) => {
      const handler = () => {
        cameraDiag('remote video event', { eventName, video: snapshotVideoElement(remoteVideoElement) })
        setRemoteVideoEpoch((prev) => prev + 1)
      }
      remoteVideoElement.addEventListener(eventName, handler)
      return { eventName, handler }
    })

    cameraDiag('attached remote video diagnostics', snapshotVideoElement(remoteVideoElement))

    return () => {
      for (const { eventName, handler } of handlers) {
        remoteVideoElement.removeEventListener(eventName, handler)
      }
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

    // Override initVideo() before first code execution so proxy is active immediately
    const w = window as unknown as Record<string, unknown>
    const videoSources = ['s0', 's1', 's2', 's3']
    const videoProxyOverrides = videoProxyOverrideRef.current
    applyVideoProxyOverride(videoSources, w, videoProxyOverrides)

    // If remote camera is already attached before Hydra init, apply override now.
    if (remoteVideoElement) {
      cameraDiag('applyRemoteCameraOverride after hydra init', snapshotVideoElement(remoteVideoElement))
      applyRemoteCameraOverride(videoSources, remoteVideoElement, w, cameraOverrideRef.current)
    }

    // Execute initial patch and render first frame immediately
    executeHydraCode(hydra, codeRef.current)
    hydra.tick(16.67)

    return () => {
      log('Destroying')
      restoreRemoteCameraOverride(w, cameraOverrideRef.current)
      restoreVideoProxyOverride(w, videoProxyOverrides)
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
      cameraDiag('camera auto-init disabled (no allowCamera + no remote video)')
      cameraInitRef.current.clear()
      reportCameraSourcesBound()
      return
    }

    const currentCode = getHydraEvalCode(codeRef.current)
    const { sources } = detectCameraUsage(currentCode)
    const w = window as unknown as Record<string, unknown>
    const remoteVideoReady = isRemoteVideoRenderable(remoteVideoElement ?? null)

    cameraDiag('camera auto-init pass', {
      sourceCount: sources.length,
      sources,
      allowCamera: Boolean(allowCamera),
      hasRemoteVideo: Boolean(remoteVideoElement),
      remoteVideoReady,
      remoteVideo: snapshotVideoElement(remoteVideoElement ?? null),
    })

    pruneStaleCameraBindings(sources)

    for (const src of sources) {
      if (cameraInitRef.current.has(src)) {
        cameraDiag('camera source already initialized; skipping', { src })
        continue
      }

      const extSrc = w[src] as { initCam?: (index?: number) => void, init?: (opts: { src: HTMLVideoElement }) => void } | undefined
      if (!extSrc) {
        cameraDiag('hydra source missing on window', { src })
        continue
      }

      try {
        if (remoteVideoElement && !remoteVideoReady) {
          cameraDiag('remote video not renderable yet; skipping source bind', {
            src,
            video: snapshotVideoElement(remoteVideoElement),
          })
          continue
        }

        if (remoteVideoElement && extSrc.init) {
          cameraDiag('binding remote video to hydra source', { src, video: snapshotVideoElement(remoteVideoElement) })
          extSrc.init.call(extSrc, { src: remoteVideoElement })
          cameraInitRef.current.add(src)
        } else if (allowCamera && extSrc.initCam) {
          cameraDiag('calling extSrc.initCam()', { src })
          extSrc.initCam()
          cameraInitRef.current.add(src)
        } else {
          cameraDiag('source had no compatible init method for current mode', {
            src,
            hasInit: typeof extSrc.init === 'function',
            hasInitCam: typeof extSrc.initCam === 'function',
            allowCamera: Boolean(allowCamera),
            hasRemoteVideo: Boolean(remoteVideoElement),
          })
        }
      } catch (err) {
        warn('Camera init failed for', src, err)
      }
    }

    reportCameraSourcesBound()
  }, [allowCamera, remoteVideoElement, remoteVideoEpoch, reportCameraSourcesBound, pruneStaleCameraBindings])

  // Re-execute code when it changes
  useEffect(() => {
    const hydra = hydraRef.current
    if (!hydra) return

    // Clear previous render graph to prevent oscillator bleed between presets.
    // Skip hush entirely when relay is active — hush() calls source.clear() which
    // kills WebRTC tracks. The new code eval follows immediately and sets up a
    // fresh render graph, so at most one frame of the old graph shows (~16ms).
    if (remoteVideoElement) {
      softHush(hydra)
    } else if (typeof (hydra as unknown as { hush?: () => void }).hush === 'function') {
      hydra.hush()
    } else {
      cameraDiag('hydra.hush unavailable; skipping graph clear for this runtime')
    }

    // Re-check camera init when code changes with camera enabled
    if (allowCamera || remoteVideoElement) {
      const { sources } = detectCameraUsage(getHydraEvalCode(code))
      const w = window as unknown as Record<string, unknown>
      const remoteVideoReady = isRemoteVideoRenderable(remoteVideoElement ?? null)

      cameraDiag('camera rebind on code change', {
        sourceCount: sources.length,
        sources,
        allowCamera: Boolean(allowCamera),
        hasRemoteVideo: Boolean(remoteVideoElement),
        remoteVideoReady,
        remoteVideo: snapshotVideoElement(remoteVideoElement ?? null),
      })

      pruneStaleCameraBindings(sources)

      for (const src of sources) {
        if (cameraInitRef.current.has(src)) {
          cameraDiag('camera source already initialized on code change; skipping', { src })
          continue
        }

        const extSrc = w[src] as { initCam?: (index?: number) => void, init?: (opts: { src: HTMLVideoElement }) => void } | undefined
        if (!extSrc) {
          cameraDiag('hydra source missing on window during code-change rebind', { src })
          continue
        }

        try {
          if (remoteVideoElement && !remoteVideoReady) {
            cameraDiag('remote video not renderable yet on code change; skipping source rebind', {
              src,
              video: snapshotVideoElement(remoteVideoElement),
            })
            continue
          }

          if (remoteVideoElement && extSrc.init) {
            cameraDiag('rebind remote video to source on code change', { src, video: snapshotVideoElement(remoteVideoElement) })
            extSrc.init.call(extSrc, { src: remoteVideoElement })
            cameraInitRef.current.add(src)
          } else if (allowCamera && extSrc.initCam) {
            cameraDiag('re-run initCam on code change', { src })
            extSrc.initCam()
            cameraInitRef.current.add(src)
          } else {
            cameraDiag('no compatible init method during code-change rebind', {
              src,
              hasInit: typeof extSrc.init === 'function',
              hasInitCam: typeof extSrc.initCam === 'function',
              allowCamera: Boolean(allowCamera),
              hasRemoteVideo: Boolean(remoteVideoElement),
            })
          }
        } catch (err) {
          warn('Camera init failed for', src, err)
        }
      }
    }

    reportCameraSourcesBound()

    executeHydraCode(hydra, code, compatRef.current ?? undefined)
    errorCountRef.current = 0
  }, [code, allowCamera, remoteVideoElement, reportCameraSourcesBound, pruneStaleCameraBindings])

  // Animation tick
  const tick = useCallback((time: number) => {
    const hydra = hydraRef.current
    if (!hydra) return

    // Update audio data from analyser
    updateAudio()

    // Ensure window.a stays valid (guards against clobbering by eval/hush cycles)
    if (compatRef.current) ensureAudioGlobals(compatRef.current)

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
