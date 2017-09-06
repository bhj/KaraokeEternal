import PropTypes from 'prop-types'
import React from 'react'
import CDGCanvas from './CDGCanvas'
import './CDGPlayer.css'
import HttpApi from 'lib/HttpApi'
const api = new HttpApi('provider/file')

class CDGPlayer extends React.Component {
  static propTypes = {
    queueItem: PropTypes.object.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    volume: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // actions
    getMedia: PropTypes.func.isRequired,
    getMediaSuccess: PropTypes.func.isRequired,
    onMediaError: PropTypes.func.isRequired,
    onMediaEnd: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
  }

  state = {
    audioPos: 0, // ms
  }

  isAudioLoaded = false
  isCDGLoaded = false
  cdgData = {} // Uint8Array

  componentDidMount () {
    this.updateSources()
    this.setVolume(this.props.volume)
  }

  componentDidUpdate (prevProps) {
    const { queueItem, volume } = this.props

    if (prevProps.queueItem.queueId !== queueItem.queueId) {
      this.updateSources()
    }

    this.updateIsPlaying()
    this.setVolume(volume)
  }

  render () {
    const { width, height } = this.props
    let canvasScale = Math.floor(width / 300)

    // make sure height would fit the viewport's
    while (height < canvasScale * 300 * 0.72) {
      canvasScale -= 1
    }

    return (
      <div style={{ width, height }} styleName='container'>
        <CDGCanvas
          width={canvasScale * 300}
          height={canvasScale * 300 * 0.72}
          isPlaying={this.props.isPlaying}
          audioPos={this.state.audioPos}
          cdgData={this.cdgData}
        />
        <br />
        <audio src={'/api/provider/file/media?type=audio&mediaId=' + this.props.queueItem.mediaId}
          preload='none'
          onCanPlayThrough={this.handleOnCanPlayThrough}
          onTimeUpdate={this.handleOnTimeUpdate}
          onEnded={this.props.onMediaEnd}
          onError={this.handleAudioError}
          ref={(c) => { this.audio = c }}
        />
      </div>
    )
  }

  updateSources = () => {
    // notification
    this.props.getMedia(this.audio.src)

    // tell audio element its source updated
    this.audio.load()

    // get cdgData
    const url = '/media?type=cdg&mediaId=' + this.props.queueItem.mediaId

    // notification
    this.props.getMedia(this.url)

    api('GET', url)
      .then(res => res.arrayBuffer())
      .then(res => {
        // arrayBuffer to Uint8Array
        this.cdgData = new Uint8Array(res)
      }).then(() => { this.handleOnCdgLoaded() })
      .catch((err) => {
        this.props.onMediaError(err.message)
      })
  }

  setVolume (vol) {
    this.audio.volume = vol
  }

  /**
 * <audio> event handlers
 */
  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      this.audio.play()
    } else {
      this.audio.pause()
    }
  }

  handleOnCanPlayThrough = () => {
    this.isAudioLoaded = true

    if (this.isCDGLoaded) {
      this.props.getMediaSuccess()
      this.updateIsPlaying()
    }
  }

  handleOnTimeUpdate = () => {
    this.setState({
      audioPos: this.audio.currentTime * 1000
    })

    this.props.onStatus({
      position: this.audio.currentTime,
      volume: this.audio.volume,
    })
  }

  handleAudioError = (err) => {
    this.props.onMediaError('Could not load audio (error ' + err.target.error.code + ')')
  }

  /**
   * CDGPlayer event handlers
   */
  handleOnCdgLoaded = () => {
    this.isCDGLoaded = true

    if (this.isAudioLoaded) {
      this.props.getMediaSuccess()
      this.updateIsPlaying()
    }
  }
}

export default CDGPlayer
