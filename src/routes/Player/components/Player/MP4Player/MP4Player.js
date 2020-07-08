import PropTypes from 'prop-types'
import React from 'react'
import './MP4Player.css'

class MP4Player extends React.Component {
  static propTypes = {
    isPlaying: PropTypes.bool.isRequired,
    mediaId: PropTypes.number.isRequired,
    mediaKey: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    onAudioElement: PropTypes.func.isRequired,
    // media events
    onEnd: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired,
    onLoad: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onStatus: PropTypes.func.isRequired,
  }

  canvas = React.createRef()
  video = document.createElement('video')
  frameId = null

  componentDidMount () {
    this.video.oncanplaythrough = this.updateIsPlaying
    this.video.onended = this.props.onEnd
    this.video.onerror = this.handleError
    this.video.onloadstart = this.props.onLoad
    this.video.onplay = this.handlePlay
    this.video.ontimeupdate = this.handleTimeUpdate
    this.video.preload = 'auto'

    this.props.onAudioElement(this.video)
    this.canvasCtx = this.canvas.current.getContext('2d')
    this.updateSources()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.mediaKey !== this.props.mediaKey) {
      this.updateSources()
    }

    if (prevProps.isPlaying !== this.props.isPlaying) {
      this.updateIsPlaying()
    }
  }

  render () {
    const { width, height } = this.props

    return (
      <canvas
        width={width}
        height={height}
        ref={this.canvas}
      />
    )
  }

  updateFrame = () => {
    this.frameId = requestAnimationFrame(this.updateFrame)

    this.canvasCtx.drawImage(this.video, 0, 0, this.video.videoWidth, this.video.videoHeight)

    const frame = this.canvasCtx.getImageData(0, 0, this.video.videoWidth, this.video.videoHeight)
    const l = frame.data.length / 4

    for (let i = 0; i < l; i++) {
      const r = frame.data[i * 4 + 0]
      const g = frame.data[i * 4 + 1]
      const b = frame.data[i * 4 + 2]

      if (g < 20 && r < 20 && b < 20) {
        frame.data[i * 4 + 3] = 0
      }
    }

    this.canvasCtx.putImageData(frame, 0, 0)
  }

  updateSources = () => {
    this.video.src = `/api/media/${this.props.mediaId}?type=video`
    this.video.load()
  }

  updateIsPlaying = () => {
    if (this.props.isPlaying) {
      this.video.play()
        .catch(err => this.props.onError(err.message))
    } else {
      this.video.pause()
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  /*
  * <video> event handlers
  */
  handleError = (el) => {
    const { message, code } = el.target.error
    this.props.onError(`${message} (code ${code})`)
  }

  handlePlay = () => {
    this.props.onPlay()
    this.updateFrame()
  }

  handleTimeUpdate = () => {
    this.props.onStatus({
      position: this.video.currentTime,
    })
  }
}

export default MP4Player
