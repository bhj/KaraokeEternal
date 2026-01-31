import React, { Suspense } from 'react'
import type { AudioResponseState, VisualizerMode } from 'shared/types'
import styles from './PlayerVisualizer.css'

// Lazy load visualizers to reduce initial bundle
const MilkdropVisualizer = React.lazy(() => import('./MilkdropVisualizer'))
const HydraVisualizer = React.lazy(() => import('./HydraVisualizer'))

interface PlayerVisualizerProps {
  audioSourceNode: MediaElementAudioSourceNode
  isPlaying: boolean
  onError(error: string): void
  presetKey: string
  sensitivity: number
  width: number
  height: number
  mode: VisualizerMode
  hydraCode?: string
  audioResponse?: AudioResponseState
}

function PlayerVisualizer ({
  audioSourceNode,
  isPlaying,
  onError,
  presetKey,
  sensitivity,
  width,
  height,
  mode,
  hydraCode,
  audioResponse,
}: PlayerVisualizerProps) {
  if (mode === 'off') {
    return null
  }

  return (
    <div style={{ width, height }} className={styles.container}>
      <Suspense fallback={null}>
        {mode === 'hydra'
          ? (
              <HydraVisualizer
                audioSourceNode={audioSourceNode}
                isPlaying={isPlaying}
                sensitivity={sensitivity}
                width={width}
                height={height}
                code={hydraCode}
                audioResponse={audioResponse}
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
