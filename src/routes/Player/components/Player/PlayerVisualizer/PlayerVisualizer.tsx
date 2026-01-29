import React, { Suspense } from 'react'
import type { VisualizerMode } from 'shared/types'
import styles from './PlayerVisualizer.css'

// Lazy load visualizers to reduce initial bundle
const MilkdropVisualizer = React.lazy(() => import('./MilkdropVisualizer'))
const ThreeVisualizer = React.lazy(() => import('./ThreeVisualizer'))

interface PlayerVisualizerProps {
  audioSourceNode: MediaElementAudioSourceNode
  isPlaying: boolean
  onError(error: string): void
  presetKey: string
  sensitivity: number
  width: number
  height: number
  mode: VisualizerMode
  colorHue: number
}

// Modes that use the Three.js visualizer
const THREE_MODES: VisualizerMode[] = ['physarum']

function PlayerVisualizer ({
  audioSourceNode,
  isPlaying,
  onError,
  presetKey,
  sensitivity,
  width,
  height,
  mode,
  colorHue,
}: PlayerVisualizerProps) {
  // Don't render if mode is 'off'
  if (mode === 'off') {
    return null
  }

  const isThreeMode = THREE_MODES.includes(mode)

  return (
    <div style={{ width, height }} className={styles.container}>
      <Suspense fallback={null}>
        {isThreeMode
          ? (
              <ThreeVisualizer
                audioSourceNode={audioSourceNode}
                isPlaying={isPlaying}
                mode={mode}
                colorHue={colorHue}
                sensitivity={sensitivity}
                width={width}
                height={height}
              />
            )
          : (
              <MilkdropVisualizer
                audioSourceNode={audioSourceNode}
                isPlaying={isPlaying}
                onError={onError}
                presetKey={presetKey}
                sensitivity={sensitivity}
                width={width}
                height={height}
              />
            )}
      </Suspense>
    </div>
  )
}

export default PlayerVisualizer
