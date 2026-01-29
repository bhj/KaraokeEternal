import React, { useRef, useEffect, useCallback } from 'react'
import Hydra from 'hydra-synth'
import type { HydraSynth } from 'hydra-synth'
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

function executeHydraCode (code: string, synth: HydraSynth, closures: AudioClosures) {
  try {
    const fn = new Function(
      'osc', 'noise', 'voronoi', 'shape', 'gradient', 'src',
      'o0', 'o1', 'o2', 'o3',
      'render',
      'bass', 'mid', 'treble', 'beat', 'energy', 'bpm', 'bright',
      code,
    )
    fn(
      synth.osc.bind(synth), synth.noise.bind(synth), synth.voronoi.bind(synth),
      synth.shape.bind(synth), synth.gradient.bind(synth), synth.src.bind(synth),
      synth.o0, synth.o1, synth.o2, synth.o3,
      synth.render.bind(synth),
      closures.bass, closures.mid, closures.treble, closures.beat,
      closures.energy, closures.bpm, closures.bright,
    )
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
}

function HydraVisualizer ({
  audioSourceNode,
  isPlaying,
  sensitivity,
  width,
  height,
  code,
}: HydraVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hydraRef = useRef<Hydra | null>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const errorCountRef = useRef<number>(0)

  const { update: updateAudio, closures } = useHydraAudio(audioSourceNode, sensitivity)

  // Initialize Hydra
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    log('Initializing')

    let hydra: Hydra
    try {
      hydra = new Hydra({
        canvas,
        width,
        height,
        detectAudio: false,
        makeGlobal: false,
        autoLoop: false,
        precision: 'mediump',
      })
    } catch (err) {
      warn('Failed to initialize:', err)
      return
    }

    hydraRef.current = hydra
    errorCountRef.current = 0

    // Execute initial patch
    executeHydraCode(code ?? DEFAULT_PATCH, hydra.synth, closures)

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
  // Only re-init when canvas dimensions change or audio closures change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height])

  // Re-execute code when it changes
  useEffect(() => {
    const hydra = hydraRef.current
    if (!hydra) return

    executeHydraCode(code ?? DEFAULT_PATCH, hydra.synth, closures)
    errorCountRef.current = 0
  }, [code, closures])

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
        executeHydraCode(DEFAULT_PATCH, hydra.synth, closures)
        errorCountRef.current = 0
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [updateAudio, closures])

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

  return (
    <div className={styles.container} style={{ width, height }}>
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
  { children: React.ReactNode, width: number, height: number },
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
            zIndex: -1,
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
    <HydraErrorBoundary width={props.width} height={props.height}>
      <HydraVisualizer {...props} />
    </HydraErrorBoundary>
  )
}

export default HydraVisualizerWithBoundary
