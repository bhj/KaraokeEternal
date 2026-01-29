import React, { useEffect, useRef, useState } from 'react'
import HydraVisualizer from '../../Player/components/Player/PlayerVisualizer/HydraVisualizer'
import styles from './HydraPreview.css'

interface HydraPreviewProps {
  code: string
  width: number
  height: number
}

const HydraPreview = ({ code, width, height }: HydraPreviewProps) => {
  // Create a dummy audio source to drive the visualizer
  const [audioSource, setAudioSource] = useState<MediaElementAudioSourceNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  useEffect(() => {
    // Setup a simulated audio beat for preview
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioCtx()
    audioCtxRef.current = ctx

    // Create a destination that doesn't actually output to speakers (gain 0)
    // but drives the analyser
    const masterGain = ctx.createGain()
    masterGain.gain.value = 0 // Mute simulated audio
    masterGain.connect(ctx.destination)

    // Oscillator to simulate "bass" / beat
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 2 // 120 BPM-ish throb
    
    // VCA for the oscillator
    const oscGain = ctx.createGain()
    oscGain.gain.value = 1.0

    osc.connect(oscGain)
    oscGain.connect(masterGain)
    osc.start()

    oscRef.current = osc
    gainRef.current = oscGain

    // We need a MediaElementSourceNode to satisfy the prop type, 
    // BUT our visualizer hook uses `createAnalyser` from the context.
    // The current `useAudioAnalyser` takes `MediaElementAudioSourceNode`.
    // We might need to mock that object or cast a regular node if the hook only checks `.context`.
    
    // Hack: The hook uses `audioSourceNode.context`. 
    // It calls `audioSourceNode.connect(gainNode)`.
    // A regular GainNode works for this signature compatibility in standard WebAudio, 
    // but the type is specific.
    
    // Let's rely on the fact that `useAudioAnalyser` just calls `.connect` and `.context`.
    // We'll cast `oscGain` to `any` -> `MediaElementAudioSourceNode` 
    // since we know the hook essentially treats it as an AudioNode.
    setAudioSource(oscGain as unknown as MediaElementAudioSourceNode)

    return () => {
      osc.stop()
      ctx.close()
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.label}>Preview (Simulated Audio)</div>
      {audioSource && (
        <HydraVisualizer
          audioSourceNode={audioSource}
          isPlaying={true}
          sensitivity={1}
          width={width}
          height={height}
          code={code}
        />
      )}
    </div>
  )
}

export default HydraPreview