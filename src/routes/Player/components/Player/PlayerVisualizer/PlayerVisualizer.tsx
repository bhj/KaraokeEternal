import React from 'react'
import butterchurn, { type Visualizer } from 'butterchurn'
import presets from 'butterchurn-presets/all'
import imageData from 'butterchurn-presets/imageData'
import styles from './PlayerVisualizer.css'

interface PlayerVisualizerProps {
  audioSourceNode: MediaElementAudioSourceNode
  isPlaying: boolean
  onError(error: string): void
  presetKey: string
  sensitivity: number
  width: number
  height: number
}

class PlayerVisualizer extends React.Component<PlayerVisualizerProps> {
  audioGainNode: GainNode | null = null
  canvas = React.createRef<HTMLCanvasElement>()
  frameId: number | null = null
  visualizer: Visualizer | null = null

  componentDidMount () {
    try {
      this.visualizer = butterchurn.createVisualizer(this.props.audioSourceNode.context, this.canvas.current, {
        width: this.props.width,
        height: this.props.height,
      })

      this.visualizer.loadExtraImages(imageData)
    } catch (err) {
      this.props.onError(err.message) // @todo pass error object instead of msg only
      return
    }

    // @todo
    // this.visualizer.setOutputAA(true)

    const preset = presets[this.props.presetKey]

    if (preset) {
      this.visualizer.loadPreset(preset, 0.0) // 2nd arg is # of seconds to blend presets
    }

    this.updateAudioSource()
    this.updatePlaying()
  }

  componentDidUpdate (prevProps: PlayerVisualizerProps) {
    const { props } = this

    if (props.audioSourceNode !== prevProps.audioSourceNode) {
      this.updateAudioSource()
    }

    if (props.isPlaying !== prevProps.isPlaying) {
      this.updatePlaying()
    }

    if (props.width !== prevProps.width || props.height !== prevProps.height) {
      this.visualizer.setRendererSize(props.width, props.height)
    }

    if (props.presetKey !== prevProps.presetKey) {
      this.visualizer.loadPreset(presets[props.presetKey], 1) // 2nd arg is # of seconds to blend presets
    }

    if (this.audioGainNode && props.sensitivity !== prevProps.sensitivity) {
      this.audioGainNode.gain.setValueAtTime(props.sensitivity, this.audioGainNode.context.currentTime)
    }
  }

  componentWillUnmount () {
    cancelAnimationFrame(this.frameId)
    this.frameId = null
  }

  render () {
    const { width, height } = this.props

    return (
      <div style={{ width, height }} className={styles.container}>
        <canvas
          width={width}
          height={height}
          ref={this.canvas}
        />
      </div>
    )
  }

  updateAudioSource = () => {
    this.audioGainNode = this.props.audioSourceNode.context.createGain()
    this.props.audioSourceNode.connect(this.audioGainNode)
    this.visualizer.connectAudio(this.audioGainNode)
  }

  updatePlaying = () => {
    if (this.props.isPlaying && !this.frameId) {
      this.renderVisualizerFrame()
    } else {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  renderVisualizerFrame = () => {
    this.frameId = requestAnimationFrame(this.renderVisualizerFrame)
    this.visualizer.render()
  }
}

export default PlayerVisualizer
