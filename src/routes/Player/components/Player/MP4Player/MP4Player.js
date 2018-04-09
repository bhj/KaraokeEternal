import PropTypes from 'prop-types'
import React from 'react'

class MP4Player extends React.Component {
  static propTypes = {
    queueItem: PropTypes.object.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    volume: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    // actions
    onMediaRequest: PropTypes.func.isRequired,
    onMediaRequestSuccess: PropTypes.func.isRequired,
    onMediaRequestError: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    onMediaEnd: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
  }

  componentDidMount () {
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

    return (
      <div style={{ width, height }}>
        <video
          preload='none'
          width={width}
          height={height}
          objectPosition={'50% 50%'}
          objectFit={'contain'}
          onCanPlayThrough={this.handleReady}
          onTimeUpdate={this.handleTimeUpdate}
          onEnded={this.props.onMediaEnd}
          onError={this.handleError}
          ref={(c) => { this.video = c }}
        />
      </div>
    )
  }

  updateSources = () => {
    const { mediaId } = this.props.queueItem

    // media request(s) started
    this.props.onMediaRequest()

    // start loading video
    this.video.src = `/api/media/?type=video&mediaId=${mediaId}`
    this.video.load()
  }

  setVolume (vol) {
    this.video.volume = vol
  }

  updateIsPlaying = () => {
    this.props.isPlaying ? this.video.play() : this.video.pause()
  }

  handleReady = () => {
    this.props.onMediaRequestSuccess()
    this.updateIsPlaying()
  }

  handleTimeUpdate = () => {
    // emit player status
    this.props.onStatus({
      position: this.video.currentTime,
      volume: this.video.volume,
    })
  }

  handleError = (err) => {
    const msg = `Could not load video (error ${err.target.error.code})`

    // media request failed
    this.props.onMediaRequestError(msg)
  }
}

export default MP4Player
