import React, { useRef, useEffect, useCallback } from 'react'
import Hydra from 'hydra-synth'
import { useHydraAudio, type AudioClosures } from './hooks/useHydraAudio'
import styles from './HydraVisualizer.css'

const log = (...args: unknown[]) => console.log('[Hydra]', ...args)
const warn = (...args: unknown[]) => console.warn('[Hydra]', ...args)

const DEFAULT_PATCH = `
osc(20, 0.1, () => bass() * 2)
  .color(1, 0.5, () => treble())
  .modulate(noise(3), () => beat() * 0.4)
  .modulate(voronoi(5, () => energy() * 2), () => beat() * 0.2)
  .rotate(() => mid() * 0.5)
  .kaleid(() => 2 + beat() * 4)
  .saturate(() => 0.6 + energy() * 0.4)
  .out()
`.trim()

// Audio closure names exposed on window for Hydra code to reference
const AUDIO_GLOBAL_NAMES = ['bass', 'mid', 'treble', 'beat', 'energy', 'bpm', 'bright'] as const

function setAudioGlobals (closures: AudioClosures) {
  const w = window as Record<string, unknown>
  w.bass = closures.bass
  w.mid = closures.mid
  w.treble = closures.treble
  w.beat = closures.beat
  w.energy = closures.energy
  w.bpm = closures.bpm
  w.bright = closures.bright
}

function clearAudioGlobals () {
  const w = window as Record<string, unknown>
  for (const name of AUDIO_GLOBAL_NAMES) {
    delete w[name]
  }
}

function executeHydraCode (hydra: Hydra, code: string) {
  try {
    hydra.eval(code)
  } catch (err) {
    warn('Code execution error:', err)
    // Don't crash — keep last working frame
  }
}

interface HydraVisualizerProps {
  audioSourceNode: MediaElementAudioSourceNode
  isPlaying: boolean
  sensitivity: number
  width: number
  height: number
  /** Hydra code to execute. If not provided, uses default patch. */
  code?: string
  /** Override container z-index for previews or overlays. */
  layer?: number
}

function HydraVisualizer ({
  audioSourceNode,
  isPlaying,
  sensitivity,
  width,
  height,
  code,
  layer,
}: HydraVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hydraRef = useRef<Hydra | null>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const errorCountRef = useRef<number>(0)
  const widthRef = useRef(width)
  const heightRef = useRef(height)
  const codeRef = useRef(code)

  // Keep refs in sync
  widthRef.current = width
  heightRef.current = height
  codeRef.current = code

  const { update: updateAudio, closures } = useHydraAudio(audioSourceNode, sensitivity)

  // Set audio closures on window so Hydra code can reference them
  useEffect(() => {
    setAudioGlobals(closures)
    return () => clearAudioGlobals()
  }, [closures])

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
    executeHydraCode(hydra, codeRef.current ?? DEFAULT_PATCH)
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

  // Re-execute code when it changes
  useEffect(() => {
    const hydra = hydraRef.current
    if (!hydra) return

    executeHydraCode(hydra, code ?? DEFAULT_PATCH)
    errorCountRef.current = 0
  }, [code])

  // Animation loop
  const tick = useCallback((time: number) => {
    const hydra = hydraRef.current
    if (!hydra) return

    // Update audio data from analyser
    updateAudio()

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

    rafRef.current = requestAnimationFrame(tick)
  }, [updateAudio])

  // Start/stop animation based on isPlaying
  useEffect(() => {
    if (isPlaying && hydraRef.current) {
      lastTimeRef.current = 0
      rafRef.current = requestAnimationFrame(tick)
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
