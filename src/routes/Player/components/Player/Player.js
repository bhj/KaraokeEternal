import PropTypes from 'prop-types'
import React from 'react'
import CDGPlayer from './CDGPlayer'
import MP4Player from './MP4Player'

const players = {
  CDGPlayer,
  MP4Player,
}

class Player extends React.Component {
  static propTypes = {
    queueItem: PropTypes.object.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    isReplayGainEnabled: PropTypes.bool.isRequired,
    rgTrackGain: PropTypes.number.isRequired,
    rgTrackPeak: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    onAudioSourceNode: PropTypes.func.isRequired,
    // events
    onMediaRequest: PropTypes.func.isRequired,
    onMediaRequestSuccess: PropTypes.func.isRequired,
    onMediaRequestError: PropTypes.func.isRequired,
    onMediaEnd: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
  }

  audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  audioGainNode = this.audioCtx.createGain()
  audioSourceNode = null

  componentDidMount () {
    this.updateVolume()
  }

  componentDidUpdate (prevProps) {
    // may have been suspended by browser if no user interaction yet
    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.audioCtx.resume()
    }

    // volume or replaygain params changed?
    if (prevProps.volume !== this.props.volume ||
        prevProps.rgTrackGain !== this.props.rgTrackGain ||
        prevProps.rgTrackPeak !== this.props.rgTrackPeak ||
        prevProps.isReplayGainEnabled !== this.props.isReplayGainEnabled) {
      this.updateVolume()
    }
  }

  handleAudioElement = el => {
    this.audioSourceNode = this.audioCtx.createMediaElementSource(el)
    this.audioSourceNode.connect(this.audioGainNode)
    this.audioGainNode.connect(this.audioCtx.destination)

    // hand back copy of original audio source
    const sourceNodeCopy = this.audioSourceNode
    this.props.onAudioSourceNode(sourceNodeCopy)
  }

  updateVolume = () => {
    let vol = this.props.volume

    if (this.props.isReplayGainEnabled) {
      const gainDb = this.props.rgTrackGain
      const peakDb = 10 * Math.log10(this.props.rgTrackPeak) // ratio to dB
      const safeGainDb = (gainDb + peakDb >= 0) ? -0.01 - peakDb : gainDb

      vol = vol * Math.pow(10, safeGainDb / 10) // dB to ratio
    }

    this.audioGainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime)
  }

  render () {
    const { player } = this.props.queueItem
    if (!player) return null

    const PlayerComponent = players[player.toUpperCase() + 'Player']

    if (typeof PlayerComponent === 'undefined') {
      this.props.onError(`Player component not found: ${player}`)
      return null
    }

    return (
      <PlayerComponent {...this.props} onAudioElement={this.handleAudioElement}/>
    )
  }
}

export default Player
