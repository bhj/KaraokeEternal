import PropTypes from 'prop-types'
import React from 'react'
import CDGraphics from 'cdgraphics'
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
    mediaRequest: PropTypes.func.isRequired,
    mediaRequestSuccess: PropTypes.func.isRequired,
    mediaRequestError: PropTypes.func.isRequired,
    onMediaError: PropTypes.func.isRequired,
    onMediaEnd: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
  }

  componentDidMount () {
    this.cdgraphics = new CDGraphics(this.canvas)
    this.setVolume(this.props.volume)
    this.updateSources()
  }

  componentDidUpdate (prevProps) {
    const { queueItem, isPlaying, volume } = this.props

    if (prevProps.queueItem.queueId !== queueItem.queueId) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== isPlaying) {
      this.updateIsPlaying()
    }

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
        <canvas
          width={canvasScale * 300}
          height={canvasScale * 300 * 0.72}
          ref={(c) => { this.canvas = c }}
        />
        <br />
        <audio
          preload='none'
          onCanPlayThrough={this.handleCanPlayThrough}
          onTimeUpdate={this.handleTimeUpdate}
          onEnded={this.props.onMediaEnd}
          onError={this.handleAudioError}
          ref={(c) => { this.audio = c }}
        />
      </div>
    )
  }

  updateSources = () => {
    const { mediaId } = this.props.queueItem
    const cdgUrl = `/media?type=cdg&mediaId=${mediaId}`
    const audioSrc = `/api/provider/file/media?type=audio&mediaId=${mediaId}`

    // media request started
    this.props.mediaRequest(mediaId)

    // load .cdg file
    api('GET', cdgUrl)
      .then(res => res.arrayBuffer())
      // arrayBuffer to Uint8Array
      .then(res => this.cdgraphics.load(new Uint8Array(res)))
      .then(() => {
        // load audio file
        this.audio.src = audioSrc
        this.audio.load()
      }).catch(err => {
        // media request failed (informational)
        this.props.mediaRequestError(mediaId, err.message)

        // emit error to room
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
      this.cdgraphics.play()
    } else {
      this.audio.pause()
      this.cdgraphics.stop()
    }
  }

  handleCanPlayThrough = () => {
    // media request finished
    this.props.mediaRequestSuccess()

    // start playback
    this.updateIsPlaying()
  }

  handleTimeUpdate = () => {
    this.cdgraphics.sync(this.audio.currentTime * 1000)

    // emit player status
    this.props.onStatus({
      position: this.audio.currentTime,
      volume: this.audio.volume,
    })
  }

  handleAudioError = (err) => {
    const msg = `Could not load audio (error ${err.target.error.code})`

    // media request failed; stops playing
    this.props.mediaRequestError(this.props.queueItem.mediaId, msg)

    // emit error to room
    this.props.onMediaError(msg)
  }
}

export default CDGPlayer
