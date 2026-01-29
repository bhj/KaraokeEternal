import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import type { ColorPalette, VisualizerMode } from 'shared/types'
import { AudioDataProvider, useAudioData } from './contexts/AudioDataContext'
import styles from './ThreeVisualizer.css'

// Lazy load visualization modes to reduce initial bundle size
const PhysarumMode = React.lazy(() => import('./modes/PhysarumMode'))

interface ThreeVisualizerProps {
  audioSourceNode: MediaElementAudioSourceNode
  isPlaying: boolean
  mode: VisualizerMode
  colorPalette: ColorPalette
  sensitivity: number
  width: number
  height: number
}

// Map mode to component
const MODE_COMPONENTS: Record<string, React.LazyExoticComponent<React.ComponentType<{ colorPalette: ColorPalette }>>> = {
  physarum: PhysarumMode,
}

/**
 * Audio-reactive post-processing effects wrapper
 * Responds to energy levels: ballads get soft effects, metal gets intense effects
 */
function AudioReactiveEffects () {
  const { audioData } = useAudioData()
  const bloomRef = useRef<typeof Bloom>(null)
  const chromaRef = useRef<typeof ChromaticAberration>(null)
  const vignetteRef = useRef<typeof Vignette>(null)

  // Cached Vector2 to avoid per-frame allocation
  const chromaOffsetRef = useRef(new THREE.Vector2(0.001, 0.001))

  // Smoothed values for gradual transitions
  const smoothedBloomRef = useRef(0.5)
  const smoothedThresholdRef = useRef(0.4)
  const smoothedChromaRef = useRef(0.001)
  const smoothedVignetteRef = useRef(0.5)

  // Update effects based on audio
  useFrame(() => {
    const { bass, beatIntensity, energySmooth, spectralCentroid } = audioData.current

    // Energy-based effect intensity
    // Low energy (ballad): soft bloom, minimal aberration, soft vignette
    // High energy (metal): intense bloom, strong aberration, dramatic vignette

    // Target bloom intensity: 0.3 (ballad) to 1.8 (metal)
    const targetBloom = 0.3 + energySmooth * 1.5 + bass * 0.5 + beatIntensity * 0.4
    smoothedBloomRef.current += (targetBloom - smoothedBloomRef.current) * 0.2

    // Target bloom threshold: 0.6 (ballad - only bright things glow) to 0.15 (metal - everything glows)
    const targetThreshold = 0.6 - energySmooth * 0.4 - spectralCentroid * 0.1
    smoothedThresholdRef.current += (targetThreshold - smoothedThresholdRef.current) * 0.12

    // Chromatic aberration: minimal for ballad, strong for metal + beat pulses
    const baseChroma = energySmooth * 0.002 + spectralCentroid * 0.001
    const targetChroma = baseChroma + beatIntensity * 0.004
    smoothedChromaRef.current += (targetChroma - smoothedChromaRef.current) * 0.3

    // Vignette: soft for ballad, intense for metal
    const targetVignette = 0.4 + energySmooth * 0.3 + spectralCentroid * 0.2
    smoothedVignetteRef.current += (targetVignette - smoothedVignetteRef.current) * 0.12

    // Apply smoothed values
    if (bloomRef.current) {
      const bloom = bloomRef.current as unknown as { intensity: number, luminanceThreshold: number }
      bloom.intensity = smoothedBloomRef.current
      bloom.luminanceThreshold = smoothedThresholdRef.current
    }

    if (chromaRef.current) {
      const chroma = chromaRef.current as unknown as { offset: THREE.Vector2 }
      chromaOffsetRef.current.set(smoothedChromaRef.current, smoothedChromaRef.current)
      chroma.offset = chromaOffsetRef.current
    }

    if (vignetteRef.current) {
      const vignette = vignetteRef.current as unknown as { darkness: number }
      vignette.darkness = smoothedVignetteRef.current
    }
  })

  return (
    <EffectComposer>
      <Bloom
        ref={bloomRef as React.RefObject<never>}
        intensity={0.5}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <ChromaticAberration
        ref={chromaRef as React.RefObject<never>}
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.001, 0.001)}
        radialModulation={false}
        modulationOffset={0.5}
      />
      <Vignette
        ref={vignetteRef as React.RefObject<never>}
        darkness={0.5}
        offset={0.3}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}

function ThreeVisualizer ({
  audioSourceNode,
  isPlaying,
  mode,
  colorPalette,
  sensitivity,
  width,
  height,
}: ThreeVisualizerProps) {
  const ModeComponent = MODE_COMPONENTS[mode]

  if (!ModeComponent) {
    return null
  }

  return (
    <div className={styles.container} style={{ width, height }}>
      <Canvas
        className={styles.canvas}
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        frameloop={isPlaying ? 'always' : 'demand'}
        dpr={[1, 1.5]}
      >
        <PerformanceMonitor
          onDecline={() => {
            // Could reduce quality here if needed
          }}
        >
          <AudioDataProvider
            audioSourceNode={audioSourceNode}
            sensitivity={sensitivity}
          >
            <Suspense fallback={null}>
              <ModeComponent colorPalette={colorPalette} />
            </Suspense>
            <AudioReactiveEffects />
          </AudioDataProvider>
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}

export default ThreeVisualizer
