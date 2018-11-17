import PropTypes from 'prop-types'
import React from 'react'
import butterchurn from 'butterchurn'
import butterchurnPresets from 'butterchurn-presets'

class PlayerVisualizer extends React.Component {
  static propTypes = {
    audioSourceNode: PropTypes.object.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    presetKey: PropTypes.string.isRequired,
    queueItem: PropTypes.object,
    sensitivity: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }

  canvas = React.createRef()
  presets = butterchurnPresets.getPresets()
  frameId = null

  componentDidMount () {
    this.visualizer = butterchurn.createVisualizer(window._audioCtx, this.canvas.current, {
      width: this.props.width,
      height: this.props.height,
    })

    // this.visualizer.setOutputAA(true)

    const preset = this.presets[this.props.presetKey]

    if (preset) {
      this.visualizer.loadPreset(preset, 0.0) // 2nd arg is # of seconds to blend presets
    }

    this.updateAudioSource()
    this.updatePlaying()
  }

  componentDidUpdate (prevProps, prevState) {
    const { props } = this

    if (props.audioSourceNode !== prevProps.audioSourceNode) {
      this.updateAudioSource()
    }

    if (this.gainNode && (props.volume !== prevProps.volume || props.sensitivity !== prevProps.sensitivity)) {
      // apply makeup gain to the visualizer's source so it
      // maintains intensity even with "real" output volume lowered
      const makeup = props.volume ? 1 / props.volume : 0
      this.gainNode.gain.setValueAtTime(makeup * props.sensitivity, window._audioCtx.currentTime)
    }

    if (props.isPlaying !== prevProps.isPlaying) {
      this.updatePlaying()
    }

    if (props.width !== prevProps.width || props.height !== prevProps.height) {
      this.visualizer.setRendererSize(props.width, props.height)
    }

    if (props.presetKey !== prevProps.presetKey) {
      this.visualizer.loadPreset(this.presets[props.presetKey], 1) // 2nd arg is # of seconds to blend presets
    }
  }

  componentWillUnmount () {
    cancelAnimationFrame(this.frameId)
  }

  render () {
    const { width, height } = this.props

    return (
      <div style={{ width, height, position: 'absolute' }}>
        <canvas
          width={width}
          height={height}
          ref={this.canvas}
        />
      </div>
    )
  }

  updateAudioSource = () => {
    this.sourceNodeCopy = this.props.audioSourceNode
    this.gainNode = new GainNode(window._audioCtx)
    this.visualizer.connectAudio(this.sourceNodeCopy.connect(this.gainNode))
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
