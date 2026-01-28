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
const ParticlesMode = React.lazy(() => import('./modes/ParticlesMode'))
const LiquidMode = React.lazy(() => import('./modes/LiquidMode'))

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
  particles: ParticlesMode,
  liquid: LiquidMode,
}

/**
 * Audio-reactive post-processing effects wrapper
 */
function AudioReactiveEffects () {
  const { audioData } = useAudioData()
  const bloomRef = useRef<typeof Bloom>(null)
  const chromaRef = useRef<typeof ChromaticAberration>(null)

  // Update effects based on audio
  useFrame(() => {
    const { bass, beatIntensity } = audioData.current

    // Audio-reactive bloom intensity
    if (bloomRef.current) {
      const bloom = bloomRef.current as unknown as { intensity: number }
      bloom.intensity = 0.5 + bass * 1.5
    }

    // Chromatic aberration pulses on beats
    if (chromaRef.current) {
      const chroma = chromaRef.current as unknown as { offset: THREE.Vector2 }
      const offset = 0.001 + beatIntensity * 0.003
      chroma.offset = new THREE.Vector2(offset, offset)
    }
  })

  return (
    <EffectComposer>
      <Bloom
        ref={bloomRef as React.RefObject<never>}
        intensity={0.5}
        luminanceThreshold={0.2}
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
        dpr={[1, 2]}
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
