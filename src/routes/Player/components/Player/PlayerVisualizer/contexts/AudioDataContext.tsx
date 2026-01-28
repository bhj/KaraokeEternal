/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useRef, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { type AudioData, useAudioAnalyser } from '../hooks/useAudioAnalyser'

// Re-export useSmoothedAudio for convenience
export { useSmoothedAudio } from '../hooks/useSmoothedAudio'
export type { SmoothedAudioData } from '../hooks/useSmoothedAudio'

interface AudioDataContextValue {
  audioData: React.MutableRefObject<AudioData>
  getAudioData: () => AudioData
}

const defaultAudioData: AudioData = {
  frequencyData: new Float32Array(64),
  waveformData: new Float32Array(128),
  bass: 0,
  mid: 0,
  treble: 0,
  isBeat: false,
  beatIntensity: 0,
  energy: 0,
  energySmooth: 0,
  spectralCentroid: 0.5,
  beatFrequency: 0.5,
}

const AudioDataContext = createContext<AudioDataContextValue | null>(null)

interface AudioDataProviderProps {
  audioSourceNode: MediaElementAudioSourceNode
  sensitivity: number
  children: React.ReactNode
}

/**
 * Inner component that uses useFrame to update audio data each frame.
 * Must be used inside R3F Canvas.
 */
function AudioDataUpdater ({
  audioSourceNode,
  sensitivity,
  children,
}: AudioDataProviderProps) {
  const { getAudioData } = useAudioAnalyser(audioSourceNode, { sensitivity })
  const audioDataRef = useRef<AudioData>(defaultAudioData)

  // Update audio data once per frame
  useFrame(() => {
    audioDataRef.current = getAudioData()
  })

  const value = useMemo(() => ({
    audioData: audioDataRef,
    getAudioData: () => audioDataRef.current,
  }), [])

  return (
    <AudioDataContext.Provider value={value}>
      {children}
    </AudioDataContext.Provider>
  )
}

/**
 * Provider component that wraps children with audio data context.
 * Children can access audio data via useAudioData hook.
 */
export function AudioDataProvider (props: AudioDataProviderProps) {
  return <AudioDataUpdater {...props} />
}

/**
 * Hook to access current audio data from visualizer components.
 * Returns a ref that updates every frame - use .current to get latest values.
 * For better performance, access audioData.current in useFrame callbacks.
 */
export function useAudioData (): AudioDataContextValue {
  const context = useContext(AudioDataContext)
  if (!context) {
    throw new Error('useAudioData must be used within an AudioDataProvider')
  }
  return context
}

/**
 * Hook that provides a callback to get audio data.
 * Useful when you need to read audio data outside of useFrame.
 */
export function useAudioDataCallback () {
  const { getAudioData } = useAudioData()
  return useCallback(() => getAudioData(), [getAudioData])
}

export default AudioDataContext
