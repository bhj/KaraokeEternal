import PropTypes from 'prop-types'
import React from 'react'
import CDGCore from './wcdg'

export default class CDGCanvas extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    audioPos: PropTypes.number.isRequired,
    cdgData: PropTypes.object.isRequired, // Uint8Array
  }

  componentDidMount () {
    this.player = new CDGCore(this.canvas)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.cdgData !== this.props.cdgData) {
      this.player.load(this.props.cdgData)
    }

    if (prevProps.audioPos !== this.props.audioPos) {
      this.player.sync(this.props.audioPos)
    }

    this.updateIsPlaying()
  }

  render () {
    return (
      <canvas
        width={this.props.width}
        height={this.props.height}
        ref={(c) => { this.canvas = c }}
      />
    )
  }

  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      this.player.play()
    } else {
      this.player.stop()
    }
  }
}
