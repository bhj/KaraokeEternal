import { useRef, useCallback, useMemo } from 'react'
import { useAudioAnalyser, type AudioData } from './useAudioAnalyser'
import { createHydraAudioCompat } from './hydraAudioCompat'
import type { AudioResponseState } from 'shared/types'

const defaultAudioData: AudioData = {
  rawFrequencyData: new Float32Array(64),
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

export function useHydraAudio (
  audioSourceNode: MediaElementAudioSourceNode | null,
  sensitivity: number,
  audioResponse?: AudioResponseState,
  overrideData?: AudioData | null,
) {
  const { getAudioData } = useAudioAnalyser(audioSourceNode, { sensitivity, audioResponse })
  const audioRef = useRef<AudioData>(defaultAudioData)
  const compat = useMemo(() => createHydraAudioCompat(), [])

  // Update ref every animation frame — called from the rAF loop
  const update = useCallback(() => {
    if (overrideData) {
      audioRef.current = overrideData
    } else {
      audioRef.current = getAudioData()
    }
    // Feed linear FFT data to window.a compat layer (rawFrequencyData, no gamma)
    compat.update(audioRef.current)
  }, [getAudioData, compat, overrideData])

  return { update, audioRef, compat }
}
