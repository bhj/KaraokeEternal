import React, { Suspense } from 'react'
import type { AudioResponseState, VisualizerMode } from 'shared/types'
import styles from './PlayerVisualizer.css'

// Lazy load visualizer to reduce initial bundle
const HydraVisualizer = React.lazy(() => import('./HydraVisualizer'))

interface PlayerVisualizerProps {
  audioSourceNode: MediaElementAudioSourceNode
  isPlaying: boolean
  sensitivity: number
  width: number
  height: number
  mode: VisualizerMode
  hydraCode?: string
  audioResponse?: AudioResponseState
  allowCamera?: boolean
}

function PlayerVisualizer ({
  audioSourceNode,
  isPlaying,
  sensitivity,
  width,
  height,
  mode,
  hydraCode,
  audioResponse,
  allowCamera,
}: PlayerVisualizerProps) {
  if (mode !== 'hydra') {
    return null
  }

  return (
    <div style={{ width, height }} className={styles.container}>
      <Suspense fallback={null}>
        <HydraVisualizer
          audioSourceNode={audioSourceNode}
          isPlaying={isPlaying}
          sensitivity={sensitivity}
          width={width}
          height={height}
          code={hydraCode}
          audioResponse={audioResponse}
          allowCamera={allowCamera}
          emitFft={true}
        />
      </Suspense>
    </div>
  )
}

export default PlayerVisualizer
