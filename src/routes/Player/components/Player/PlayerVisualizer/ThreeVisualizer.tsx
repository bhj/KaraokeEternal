import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import type { ColorPalette, VisualizerMode } from 'shared/types'
import { AudioDataProvider } from './contexts/AudioDataContext'
import styles from './ThreeVisualizer.css'

// Lazy load visualization modes to reduce initial bundle size
const ParticlesMode = React.lazy(() => import('./modes/ParticlesMode'))
const GeometryMode = React.lazy(() => import('./modes/GeometryMode'))
const ShaderMode = React.lazy(() => import('./modes/ShaderMode'))
const SpectrumMode = React.lazy(() => import('./modes/SpectrumMode'))
const ReactiveMode = React.lazy(() => import('./modes/ReactiveMode'))

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
  geometry: GeometryMode,
  shader: ShaderMode,
  spectrum: SpectrumMode,
  reactive: ReactiveMode,
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
          </AudioDataProvider>
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}

export default ThreeVisualizer
