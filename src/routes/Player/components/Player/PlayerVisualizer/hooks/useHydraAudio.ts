import { useRef, useCallback, useMemo } from 'react'
import { useAudioAnalyser, type AudioData } from './useAudioAnalyser'
import { createHydraAudioCompat } from './hydraAudioCompat'
import type { AudioResponseState } from 'shared/types'

export interface AudioClosures {
  bass: () => number
  mid: () => number
  treble: () => number
  beat: () => number
  energy: () => number
  bpm: () => number
  bright: () => number
}

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
) {
  const { getAudioData } = useAudioAnalyser(audioSourceNode, { sensitivity, audioResponse })
  const audioRef = useRef<AudioData>(defaultAudioData)
  const compat = useMemo(() => createHydraAudioCompat(), [])

  // Update ref every animation frame — called from the rAF loop
  const update = useCallback(() => {
    audioRef.current = getAudioData()
    // Feed linear FFT data to window.a compat layer (rawFrequencyData, no gamma)
    compat.update(audioRef.current)
  }, [getAudioData, compat])

  // Stable closures that Hydra code references via arrow functions
  const closures: AudioClosures = useMemo(() => ({
    bass: () => audioRef.current.bass,
    mid: () => audioRef.current.mid,
    treble: () => audioRef.current.treble,
    beat: () => audioRef.current.beatIntensity,
    energy: () => audioRef.current.energy,
    bpm: () => audioRef.current.beatFrequency,
    bright: () => audioRef.current.spectralCentroid,
  }), [])

  return { update, closures, audioRef, compat }
}
