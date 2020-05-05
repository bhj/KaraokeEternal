import PropTypes from 'prop-types'
import React from 'react'
import butterchurn from 'butterchurn'
import butterchurnPresets from 'butterchurn-presets'
import './PlayerVisualizer.css'

class PlayerVisualizer extends React.Component {
  static propTypes = {
    audioSourceNode: PropTypes.object.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    presetKey: PropTypes.string.isRequired,
    volume: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
  }

  canvas = React.createRef()
  presets = butterchurnPresets.getPresets()
  frameId = null

  componentDidMount () {
    this.visualizer = butterchurn.createVisualizer(this.props.audioSourceNode.context, this.canvas.current, {
      width: this.props.width,
      height: this.props.height,
    })

    // @todo
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
      <div style={{ width, height }} styleName='container'>
        <canvas
          width={width}
          height={height}
          ref={this.canvas}
        />
      </div>
    )
  }

  updateAudioSource = () => {
    this.visualizer.connectAudio(this.props.audioSourceNode)
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
