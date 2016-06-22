import React, { PropTypes } from 'react';
import CDGCore from './wcdg';

export default class CDGCanvas extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    audioPos: PropTypes.number.isRequired,
    cdgData: PropTypes.array.isRequired,
  };

  componentDidMount () {
    this.player = new CDGCore(this.canvas)
  }

  componentDidUpdate (prevProps) {
    console.log('CDGCanvas: componentDidUpdate()')

    if (prevProps.cdgData !== this.props.cdgData) {
      this.player.load(this.props.cdgData)
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }

    if (prevProps.audioPos !== this.props.audioPos) {
      this.player.sync(this.props.audioPos)
    }
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
