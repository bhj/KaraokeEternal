import React, { useRef, useEffect, useCallback } from 'react'
import Hydra from 'hydra-synth'
import styles from './HydraPreview.css'

const log = (...args: unknown[]) => console.log('[HydraPreview]', ...args)
const warn = (...args: unknown[]) => console.warn('[HydraPreview]', ...args)

const DEFAULT_PATCH = 'osc(10, 0.1, 1.5).out()'

function executeCode (hydra: Hydra, code: string) {
  try {
    hydra.eval(code)
  } catch (err) {
    warn('Code execution error:', err)
  }
}

// Stub audio closures so Hydra code referencing them doesn't crash
function setAudioStubs () {
  const w = window as Record<string, unknown>
  const zero = () => 0
  for (const name of ['bass', 'mid', 'treble', 'beat', 'energy', 'bpm', 'bright']) {
    if (typeof w[name] !== 'function') {
      w[name] = zero
    }
  }
}

interface HydraPreviewProps {
  code: string
  width: number
  height: number
}

function HydraPreview ({ code, width, height }: HydraPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hydraRef = useRef<Hydra | null>(null)
  const rafRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const codeRef = useRef(code)
  const widthRef = useRef(width)
  const heightRef = useRef(height)

  codeRef.current = code
  widthRef.current = width
  heightRef.current = height

  // Initialize Hydra on mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    setAudioStubs()
    log('Initializing preview')

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
    executeCode(hydra, codeRef.current || DEFAULT_PATCH)
    hydra.tick(16.67)

    return () => {
      log('Destroying preview')
      cancelAnimationFrame(rafRef.current)
      try {
        hydra.regl.destroy()
      } catch {
        // WebGL context may already be lost
      }
      hydraRef.current = null
    }
  }, [])

  // Resize without recreating context
  useEffect(() => {
    const hydra = hydraRef.current
    if (!hydra) return
    hydra.setResolution(width, height)
  }, [width, height])

  // Re-execute code when it changes
  useEffect(() => {
    const hydra = hydraRef.current
    if (!hydra) return
    setAudioStubs()
    executeCode(hydra, code || DEFAULT_PATCH)
  }, [code])

  // Animation loop
  const tick = useCallback((time: number) => {
    const hydra = hydraRef.current
    if (!hydra) return

    const dt = lastTimeRef.current ? time - lastTimeRef.current : 16.67
    lastTimeRef.current = time

    try {
      hydra.tick(dt)
    } catch {
      // keep running
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  // Start loop on mount
  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={width}
        height={height}
      />
    </div>
  )
}

export default HydraPreview
