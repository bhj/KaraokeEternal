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
          onCanPlayThrough={this.handleAudioReady}
          onTimeUpdate={this.handleAudioTimeUpdate}
          onEnded={this.props.onMediaEnd}
          onError={this.handleAudioError}
          ref={(c) => { this.audio = c }}
        />
      </div>
    )
  }

  updateSources = () => {
    const { mediaId } = this.props.queueItem

    // media request(s) started
    this.props.mediaRequest(mediaId)

    // start loading audio
    this.audio.src = `/api/provider/file/media?type=audio&mediaId=${mediaId}`
    this.audio.load()

    // start loading .cdg
    this.cdgraphics.stop()
    this.isCDGLoaded = false

    api('GET', `/media?type=cdg&mediaId=${mediaId}`)
      .then(res => res.arrayBuffer())
      .then(res => {
        // arrayBuffer to Uint8Array
        this.cdgraphics.load(new Uint8Array(res))

        this.handleCDGReady()
      }).catch(err => {
        // media request(s) failed
        this.props.mediaRequestError(mediaId, err.message)

        // emit error to room
        this.props.onMediaError(err.message)
      })
  }

  setVolume (vol) {
    this.audio.volume = vol
  }

  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      this.audio.play()
      this.cdgraphics.play()
    } else {
      this.audio.pause()
      this.cdgraphics.stop()
    }
  }

  handleCDGReady = () => {
    this.isCDGLoaded = true

    // HAVE_ENOUGH_DATA?
    if (this.audio.readyState === 4) {
      // media request(s) finished (enough)
      this.props.mediaRequestSuccess()
      this.updateIsPlaying()
    }
  }

  /**
 * <audio> event handlers
 */
  handleAudioReady = () => {
    if (this.isCDGLoaded) {
      // media request(s) finished (enough)
      this.props.mediaRequestSuccess()
      this.updateIsPlaying()
    }
  }

  handleAudioTimeUpdate = () => {
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
