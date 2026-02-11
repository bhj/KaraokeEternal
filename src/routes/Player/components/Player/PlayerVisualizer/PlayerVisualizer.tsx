import React, { Suspense } from 'react'
import type { VisualizerMode } from 'shared/types'
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
  allowCamera?: boolean
  remoteVideoElement?: HTMLVideoElement | null
}

function PlayerVisualizer ({
  audioSourceNode,
  isPlaying,
  sensitivity,
  width,
  height,
  mode,
  hydraCode,
  allowCamera,
  remoteVideoElement,
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
          allowCamera={allowCamera}
          remoteVideoElement={remoteVideoElement}
          emitFft={true}
        />
      </Suspense>
    </div>
  )
}

export default PlayerVisualizer
